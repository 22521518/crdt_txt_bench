import React from 'react'
import type { RichTextAdapter } from '@/adapters/richtext-adapter'
import { RichTextSingleton, useRichTextSingleton, type SwitchEditorOptions } from '../hooks/richtext-singleton'

export interface RichTextContextValue {
  editor: RichTextAdapter | null
  // setEditor: (editor: RichTextWrapper | null) => void
  // switchEditor: (newEditor: RichTextWrapper, options?: SwitchEditorOptions) => void
}

export const RichTextContext = React.createContext<RichTextContextValue | null>(null)

export interface RichTextProviderProps {
  editor: RichTextAdapter | null
  children: React.ReactNode
}

/**
 * RichTextProvider manages the active RichTextWrapper instance in the React tree.
 * When no `editor` prop is provided, it automatically connects to and synchronizes
 * with the global RichTextSingleton.
 */
export function RichTextProvider({ editor, children }: RichTextProviderProps) {
  return (
    <RichTextContext.Provider value={{ editor }}>
      {children}
    </RichTextContext.Provider>
  )
}

/**
 * Hook to get the current RichTextWrapper instance from React Context or the Singleton.
 * Automatically triggers a re-render when the active editor changes or switches.
 */
export function useCurrentEditor(): RichTextAdapter | null {
  const context = React.useContext(RichTextContext)
  const singletonEditor = useRichTextSingleton()
  return context?.editor ?? singletonEditor
}