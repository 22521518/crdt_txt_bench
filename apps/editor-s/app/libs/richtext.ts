import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import { Editor as TiptapEditor } from "@tiptap/react"
// import { assert } from "console"
import type { RichTextTransaction } from "./richtext-transaction"
import { createRichTextWrapper, createTipTapEditor } from "@/packages/tiptaps/tiptap-editor-factory";

export interface RichTextNodeWrapper {
  getChildren: () => RichTextNodeWrapper[],
  getLength: () => number
}

export interface RichTextWrapper {
  // editor: TiptapEditor | any
  createTransaction(): RichTextTransaction;
  isExtensionAvailable(extensionNames: string | string[]): boolean

  isEditable: () => boolean,
  isFocus: () => boolean,

  isNodeTypeSelected: (types: string[]) => boolean
  isSelectedNodeTypeActive?: (name: string | null, attributes?: {}) => boolean // Attributes are the metadata for the node type of the rich text
  isMarkActive?: (name: string | null, attributes?: {}) => boolean
  isNodeTypeInSchema: (typeName: string) => boolean
  isMarkInSchema: (markName: string) => boolean

  findNodePosition: (node: any) => number | null

  getSelectionMarkTypeList: () => readonly any[]
  getMarkTypeInSchema: (markName: string) => any | undefined
  // getSelectionNodeTypeAttributes: (typeName: string | any) => any | undefined
  // getSelectionMarkAttributes: (markName: string | any) => any | undefined
  getSelectionAttributes: (typeOrName: string | any) => any
  getSelectionType: () => 'inline' | 'block' | 'unknown' // `inline` may be considered as text, whereas `block` is node ||| `unknown` is i don know
  getSelectionNodes: () => RichTextNodeWrapper

  isSelectionMarkable: (markName: string | any, attributes?: {}) => boolean
  isNodeSetable: (markName: string | any, attributes?: {}) => boolean
  // setSelectionWithMark: (markName: string | any, attributes?: {}) => boolean
  // unsetSelectionWithMark: (markName: string | any) => boolean
  toggleSelectionWithMark: (markName: string | any, attributes?: {}) => boolean // state = !state

  getSelection: () => { from: number, to: number, isEmpty: boolean, $anchor?: any }
  getCursorCoord: () => EditorCursorCoord

  createNode(pos: number, atNode?: any): any

  undoable?: () => boolean
  redoable?: () => boolean
  undo?: () => boolean
  redo?: () => boolean

  // Content transfer API
  getHTML: () => any
  setContentFromHTML: (htmlContent: string) => void
  getInternalContent: () => any
  setInternalContent: (content: any) => void

  // Event subscription API
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback: (...args: any[]) => void) => void

  // DOM cycle API
  doBeforeMount?: () => void
  mount: (element: HTMLElement) => void
  doAfterMount?: () => void

  doBeforeUnmount?: () => void
  unmount: () => void
  doAfterUnmount?: () => void

  destroy: () => void
  isDestroyed: () => boolean
}

export const isValidPosition = (
  pos: number | null | undefined
): pos is number => {
  return typeof pos === "number" &&
    Number.isFinite(pos) &&
    pos >= 0;
};

export const checkEditorMarkNodeActive = (editor: RichTextWrapper, name: string | null, attributes?: {}) => {
  const checkActive = editor.isMarkActive ?? editor.isSelectedNodeTypeActive
  if (!checkActive) return false
  return checkActive(name, attributes)
}

/**
 * Singleton of the active instance RichTextWrapper.
 * (switchEditor) to other libs (Quill, Slate, ProseMirror)
 * with maintaining the existing content.
 */
export class RichTextSingleton {
  private static instance: RichTextWrapper | null = null
  private static listeners = new Set<(instance: RichTextWrapper | null) => void>()

  public static getInstance(): RichTextWrapper | null {
    if (this.instance)
      return this.instance
    return createRichTextWrapper(createTipTapEditor())
  }

  public static setInstance(editor: RichTextWrapper | null): void {
    if (this.instance === editor) return
    this.instance = editor
    this.notify()
  }

  public static subscribe(listener: (instance: RichTextWrapper | null) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)

  }

  private static notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.instance)
      } catch (e) {
        console.error("Error in RichTextSingleton listener:", e)
      }
    })
  }

  /**
   * Switc instance RichTextWrapper to instances of other libs.
   */
  public static switchEditor(
    newEditor: RichTextWrapper,
    options?: { transferContent?: boolean }
  ): void {
    // assert(false, "This need to be reimplement because I didn't do it yet!")
    // throw new Error("This need to be reimplement because I didn't do it yet!")
    const oldEditor = this.instance
    if (oldEditor === newEditor) return

    const shouldTransfer = options?.transferContent !== false

    if (shouldTransfer && oldEditor) {
      try {
        let htmlContent = oldEditor.getHTML()
        if (htmlContent) {
          newEditor.setContentFromHTML(htmlContent)
        }
        // if (typeof oldEditor.getContent === 'function') {
        //   content = oldEditor.getContent()
        // } else if (oldEditor?.getHTML) {
        //   htmlContent = oldEditor.getHTML()
        // }

        // if (content !== null && content !== undefined) {
        //   if (typeof newEditor.setContent === 'function') {
        //     newEditor.setContent(content)
        //   }
        // }
      } catch (err) {
        console.warn("Could not transfer content during editor switch:", err)
      }
    }

    this.setInstance(newEditor)
  }
}