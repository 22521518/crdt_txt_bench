import { useRichTextContext } from '@/hooks/richtext-singleton'
import { EditorContent as TiptapView } from "@tiptap/react"

export function EditorContent() {
  const { editor } = useRichTextContext()
  
  if (!editor) return <>Something wrong!</>
  return (<>
    { editor.engine === 'tiptap' && <TiptapView editor={editor.editor} role="presentation" className="richtxt-editor-content"/> }
  </>)
}
