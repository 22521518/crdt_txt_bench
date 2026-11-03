import type { RichTextWrapper } from '@/libs/richtext'
import React from 'react'

const RichTextContext = React.createContext<RichTextWrapper | null>(null)
const RichTextDispatch = React.createContext(null)

type ContextProps = {
  editor: RichTextWrapper, 
  children: React.ReactNode
}

export function RichTextProvider({ editor, children }: ContextProps) {
  const dispatch = React.useCallback(()=>{}, [editor])
  return (
    <RichTextContext value={editor} >
      <RichTextDispatch value={ null /** dispatch */}>
        { children }
      </RichTextDispatch>
    </RichTextContext>
  )
}

export function useRichTextContext() {
  const contextEditor = React.useContext(RichTextContext)
  const contextEditorDispatch = React.useContext(RichTextDispatch)

  if (!contextEditor || !contextEditorDispatch) {
    throw new Error('useRichTextContext must be used within RichTextProvider')
  }

  return [contextEditor, contextEditorDispatch ]
}