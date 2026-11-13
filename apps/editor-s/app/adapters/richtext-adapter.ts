import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import type { RichTextTransaction } from "./richtext-transaction"
import { Editor } from "@tiptap/react"

export interface RichTextNodeWrapper {
  getChildren: () => RichTextNodeWrapper[]
  getLength: () => number
}

export type SupportedEngineType = 'tiptap' | 'slate' | 'quill'

export interface RichTextAdapter {
  editor: Editor | null
  engine: SupportedEngineType
  /** The underlying editor engine instance (e.g., Tiptap Editor, Slate instance, etc.) */
  createTransaction(): RichTextTransaction
  isExtensionAvailable(extensionNames: string | string[]): boolean

  isEditable: () => boolean
  isFocus: () => boolean

  isNodeTypeSelected: (types: string[]) => boolean
  isNodeTypeActive?: (name: string | null, attributes?: {}) => boolean
  isMarkActive?: (name: string | null, attributes?: {}) => boolean
  isNodeTypeInSchema: (typeName: string) => boolean
  isMarkInSchema: (markName: string) => boolean

  findNodePosition: (node: any) => number | null

  getSelectionMarkTypeList: () => readonly any[]
  getMarkTypeInSchema: (markName: string) => any | undefined
  getSelectionAttributes: (typeOrName: string | any) => any
  getSelectionType: () => 'inline' | 'block' | 'unknown'
  getSelectionNodes: () => RichTextNodeWrapper

  isSelectionMarkable: (markName: string | any, attributes?: {}) => boolean
  isNodeSetable: (markName: string | any, attributes?: {}) => boolean
  toggleSelectionWithMark: (markName: string | any, attributes?: {}) => boolean

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

  // DOM lifecycle API
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
    pos >= 0
}

export const checkEditorMarkNodeActive = (editor: RichTextAdapter, name: string | null, attributes?: {}) => {
  const checkActive = editor.isMarkActive ?? editor.isNodeTypeActive
  if (!checkActive) return false
  return checkActive(name, attributes)
}