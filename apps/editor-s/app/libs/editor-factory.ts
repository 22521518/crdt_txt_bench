import type { RichTextWrapper } from "./richtext"

export interface EditorFactoryOptions {
  initialContent?: any
  editable?: boolean
  autofocus?: any
  [key: string]: any
}

/**
 * Abstract factory interface for creating RichTextWrapper instances.
 * Concrete editor engines (Tiptap, Quill, Slate, etc.) implement this interface.
 */
export interface RichTextEditorFactory<
  TOptions extends EditorFactoryOptions = EditorFactoryOptions,
  TWrapper extends RichTextWrapper = RichTextWrapper
> {
  readonly name: string
  createEditor(options?: TOptions): TWrapper
}
