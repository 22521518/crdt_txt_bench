import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import { Editor as TiptapEditor } from "@tiptap/react"

export interface RichTextWrapper {
  editor: TiptapEditor | any
  useEditorState: () => any // This hook allows you to watch for changes on the editor instance.

  isEditable: () => boolean,
  isFocus: () => boolean,

  isNodeTypeSelected: (types: string[]) => boolean
  isSelectedNodeTypeActive?: (name: string, attributes?: {}) => boolean // Attributes are the metadata for the node type of the rich text
  isNodeTypeInSchema: (typeName: string) => boolean
  isMarkInSchema: (markName: string) => boolean

  isSelectionMarkable: (markName: string) => boolean
  setSelectionWithMark: (markName: string) => boolean
  unsetSelectionWithMark: (markName: string) => boolean

  getCursorCoord: () => EditorCursorCoord

  undoable?: () => boolean
  redoable?: () => boolean
  undo?: () => boolean
  redo?: () => boolean

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

export function RichTextReducer(wrapper: RichTextWrapper, action: any) {
  switch (action.type) {
    case 'undo':
    case 'redo':

    case 'toggle-heading':
      const level = action.level

    case 'mark-bold':
    case 'mark-italic':
    case 'mark-underline':
    case 'mark-strike':
    case 'mark-code':

    case 'mark-superscript':
    case 'mark-subscript':

    case 'textalign-left':
    case 'textalign-right':
    case 'textalign-center':
    case 'textalign-justify':

    case 'highlight-text':

    case 'upload-img':

    default: {
      throw Error('Unknown action: ' + action.type);
    }
  }
}