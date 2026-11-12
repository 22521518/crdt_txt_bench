import React from 'react'
import type { RichTextWrapper, SwitchEditorOptions } from '@/libs/richtext'
import { RichTextSingleton } from '@/libs/richtext'

export interface RichTextContextValue {
  editor: RichTextWrapper | null
  setEditor: (editor: RichTextWrapper | null) => void
  switchEditor: (newEditor: RichTextWrapper, options?: SwitchEditorOptions) => void
}

const RichTextContext = React.createContext<RichTextContextValue | null>(null)

export interface RichTextProviderProps {
  editor?: RichTextWrapper | null
  children: React.ReactNode
}

/**
 * Hook to reactively subscribe to changes in RichTextSingleton via useSyncExternalStore.
 */
export function useRichTextSingleton(): RichTextWrapper | null {
  return React.useSyncExternalStore(
    RichTextSingleton.subscribe.bind(RichTextSingleton),
    RichTextSingleton.getSnapshot,
    () => null // Server snapshot for SSR hydration safety
  )
}

/**
 * RichTextProvider manages the active RichTextWrapper instance in the React tree.
 * When no `editor` prop is provided, it automatically connects to and synchronizes
 * with the global RichTextSingleton.
 */
export function RichTextProvider({ editor: externalEditor, children }: RichTextProviderProps) {
  const singletonEditor = useRichTextSingleton()
  const activeEditor = externalEditor !== undefined ? externalEditor : singletonEditor

  const setEditor = React.useCallback((editor: RichTextWrapper | null) => 
    RichTextSingleton.setInstance(editor), [])
  const switchEditor = React.useCallback((newEditor: RichTextWrapper, options?: SwitchEditorOptions) => 
    RichTextSingleton.switchEditor(newEditor, options), [])

  const value = React.useMemo<RichTextContextValue>(
    () => ({ editor: activeEditor, setEditor, switchEditor, }),
    [activeEditor, setEditor, switchEditor])

  return (
    <RichTextContext.Provider value={value}>
      {children}
    </RichTextContext.Provider>
  )
}

/**
 * Hook to get the current RichTextWrapper instance from React Context or the Singleton.
 * Automatically triggers a re-render when the active editor changes or switches.
 */
export function useCurrentEditor(): RichTextWrapper | null {
  const context = React.useContext(RichTextContext)
  const singletonEditor = useRichTextSingleton()
  return context?.editor ?? singletonEditor
}

/**
 * Hook returning the active editor along with setEditor and switchEditor controls.
 * Supports both tuple destructuring: `const [editor, setEditor] = useRichTextContext()`
 * and object destructuring: `const { editor, setEditor, switchEditor } = useRichTextContext()`.
 */
export function useRichTextContext() {
  const context = React.useContext(RichTextContext)
  const singletonEditor = useRichTextSingleton()

  const editor = context?.editor ?? singletonEditor
  const setEditor = context?.setEditor ?? RichTextSingleton.setInstance.bind(RichTextSingleton)
  const switchEditor = context?.switchEditor ?? RichTextSingleton.switchEditor.bind(RichTextSingleton)

  const result: any = [editor, setEditor]
  result.editor = editor
  result.setEditor = setEditor
  result.switchEditor = switchEditor

  return result as [RichTextWrapper | null, (editor: RichTextWrapper | null) => void] & {
    editor: RichTextWrapper | null
    setEditor: (editor: RichTextWrapper | null) => void
    switchEditor: (newEditor: RichTextWrapper, options?: SwitchEditorOptions) => void
  }
}
