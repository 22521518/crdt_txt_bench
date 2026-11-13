import type { RichTextAdapter } from "./richtext-adapter"

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
  TWrapper extends RichTextAdapter = RichTextAdapter
> {
  readonly name: string
  createEditor(options?: TOptions): { adapter: TWrapper, editor: any }
}
