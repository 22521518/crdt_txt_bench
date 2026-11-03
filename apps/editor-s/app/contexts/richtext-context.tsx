import type { RichTextWrapper } from '@/libs/richtext'
import { RichTextSingleton } from '@/libs/richtext'
import { useCreateTipTapEditor } from '@/packages/tiptaps/tiptap-editor-factory'
import React from 'react'

export interface RichTextContextValue {
  editor: RichTextWrapper | null
  setEditor: (editor: RichTextWrapper | null) => void
  switchEditor: (newEditor: RichTextWrapper, options?: { transferContent?: boolean }) => void
}

const RichTextContext = React.createContext<RichTextContextValue | null>(null)

export type RichTextProviderProps = {
  editor?: RichTextWrapper | null
  children: React.ReactNode
}

/**
 * RichTextProvider manage the active instance RichTextWrapper.
 * If no `editor`, using the default factory `useCreateTipTapEditor`.
 * Sync with RichTextSingleton and allow mechanism to adapt with other libs.
 */
export function RichTextProvider({ editor: externalEditor, children }: RichTextProviderProps) {
  const defaultEditor = useCreateTipTapEditor()

  const [currentEditor, setCurrentEditor] = React.useState<RichTextWrapper | null>(() => {
    const initial = externalEditor ?? defaultEditor
    if (initial) {
      RichTextSingleton.setInstance(initial)
    }
    return initial
  })

  // Run when externalEditor or defaultEditor change
  React.useEffect(() => {
    const active = externalEditor ?? defaultEditor
    if (active) {
      setCurrentEditor(active)
      RichTextSingleton.setInstance(active)
    }
  }, [externalEditor, defaultEditor])

  // Listen the change when singleton change with `switchEditor` event
  React.useEffect(() => {
    const unsubscribe = RichTextSingleton.subscribe((inst) => {
      setCurrentEditor(inst)
    })
    return unsubscribe
  }, [])

  const setEditor = React.useCallback((editor: RichTextWrapper | null) => {
    setCurrentEditor(editor)
    RichTextSingleton.setInstance(editor)
  }, [])

  const switchEditor = React.useCallback((newEditor: RichTextWrapper, options?: { transferContent?: boolean }) => {
    RichTextSingleton.switchEditor(newEditor, options)
    setCurrentEditor(newEditor)
  }, [])

  const value = React.useMemo<RichTextContextValue>(() => ({
    editor: currentEditor ?? externalEditor ?? defaultEditor,
    setEditor,
    switchEditor,
  }), [currentEditor, externalEditor, defaultEditor, setEditor, switchEditor])

  return (
    <RichTextContext value={value}>
      {children}
    </RichTextContext>
  )
}

/**
 * Hook to get instance RichTextWrapper from Context or Singleton
 */
export function useCurrentEditor(): RichTextWrapper | null {
  const context = React.useContext(RichTextContext)
  return context?.editor ?? RichTextSingleton.getInstance()
}

/**
 * Hook return context editor along with setEditor, switchEditor
 * Supporting array [editor, setEditor] and object { editor, setEditor, switchEditor }
 */
export function useRichTextContext() {
  const context = React.useContext(RichTextContext)
  const editor = context?.editor ?? RichTextSingleton.getInstance()
  const setEditor = context?.setEditor ?? RichTextSingleton.setInstance.bind(RichTextSingleton)
  const switchEditor = context?.switchEditor ?? RichTextSingleton.switchEditor.bind(RichTextSingleton)

  const result: any = [editor, setEditor]
  result.editor = editor
  result.setEditor = setEditor
  result.switchEditor = switchEditor

  return result as [RichTextWrapper | null, (editor: RichTextWrapper | null) => void] & {
    editor: RichTextWrapper | null
    setEditor: (editor: RichTextWrapper | null) => void
    switchEditor: (newEditor: RichTextWrapper, options?: { transferContent?: boolean }) => void
  }
}
