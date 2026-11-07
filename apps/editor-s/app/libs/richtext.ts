import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import { Editor as TiptapEditor } from "@tiptap/react"
// import { assert } from "console"
import type { RichTextTransaction } from "./richtext-transaction"

export interface RichTextNodeWrapper {
  getChildren: () => RichTextNodeWrapper[],
  getLength: () => number
}

export interface RichTextWrapper {
  editor: TiptapEditor | any
  createTransaction(): RichTextTransaction;

  isEditable: () => boolean,
  isFocus: () => boolean,

  isNodeTypeSelected: (types: string[]) => boolean
  isSelectedNodeTypeActive?: (name: string, attributes?: {}) => boolean // Attributes are the metadata for the node type of the rich text
  isMarkActive?: (name: string, attributes?: {}) => boolean
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
  getContent?: () => any
  setContent?: (content: any) => void

  // Event subscription API
  on?: (event: string, callback: (...args: any[]) => void) => void
  off?: (event: string, callback: (...args: any[]) => void) => void

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

/**
 * Singleton of the active instance RichTextWrapper.
 * (switchEditor) to other libs (Quill, Slate, ProseMirror)
 * with maintaining the existing content.
 */
export class RichTextSingleton {
  private static instance: RichTextWrapper | null = null
  private static listeners = new Set<(instance: RichTextWrapper | null) => void>()

  public static getInstance(): RichTextWrapper | null {
    return this.instance
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
        let content: any = null
        if (typeof oldEditor.getContent === 'function') {
          content = oldEditor.getContent()
        } else if (oldEditor.editor?.getHTML) {
          content = oldEditor.editor.getHTML()
        }

        if (content !== null && content !== undefined) {
          if (typeof newEditor.setContent === 'function') {
            newEditor.setContent(content)
          } else if (newEditor.editor?.commands?.setContent) {
            newEditor.editor.commands.setContent(content)
          }
        }
      } catch (err) {
        console.warn("Could not transfer content during editor switch:", err)
      }
    }

    this.setInstance(newEditor)
  }
}

// export function RichTextReducer(wrapper: RichTextWrapper, action: any) {
//   switch (action.type) {
//     case 'undo':
//     case 'redo':

//     case 'toggle-heading':
//       const level = action.level

//     case 'mark-bold':
//     case 'mark-italic':
//     case 'mark-underline':
//     case 'mark-strike':
//     case 'mark-code':

//     case 'mark-superscript':
//     case 'mark-subscript':

//     case 'textalign-left':
//     case 'textalign-right':
//     case 'textalign-center':
//     case 'textalign-justify':

//     case 'highlight-text':

//     case 'upload-img':

//     default: {
//       throw Error('Unknown action: ' + action.type);
//     }
//   }
// }
