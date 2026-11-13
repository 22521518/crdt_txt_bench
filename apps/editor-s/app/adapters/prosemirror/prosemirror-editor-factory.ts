import type { EditorFactoryOptions } from "@/adapters/richtext-factory"
import { RichTextWrapper, type RichTextNodeWrapper, type RichTextAdapter } from "@/adapters/richtext-adapter"
import { getDefaultExtensions } from "../tiptaps/tiptap-editor-factory"
import { getProsemirrorPropsFromTiptapLegacy } from "./_tiptaps"
import { EditorState, Plugin } from "@tiptap/pm/state"
import { Schema } from "@tiptap/pm/model"
import type { Content, RichTextTransaction } from "@/adapters/richtext-transaction"
import type { Node } from "@tiptap/pm/model"
import { createDocument } from "./helpers"
import { EditorView } from "@tiptap/pm/view"
import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import { ProseMirrorTransaction } from "./prosemirror-transaction"

type ProsemirrorEditorOptions = EditorFactoryOptions & {
  initialContent?: any
  setAsSingleton?: boolean
}

/**
 * Factory method to instantiate a Prosemirror editor wrapped in RichTextWrapper.
 */
export const createProsemirrorEditor = (options?: ProsemirrorEditorOptions): RichTextAdapter => {
  const { schema: tiptapSchema, plugins: tiptapPlugins } = getProsemirrorPropsFromTiptapLegacy()
  // because the fallback when create docs disable the collab extension so the prosemirro-model have to be reset
  const { doc: initialDoc, newSchema, newPlugins } = createProsemirrorDocument(options?.initialContent, tiptapSchema, tiptapPlugins)
  const state = EditorState.create({ doc: initialDoc, schema: newSchema, plugins: newPlugins });
  const wrapper = createRichTextWrapper(state)

  if (options?.setAsSingleton) {
    RichTextWrapper.setInstance(wrapper)
  }

  return wrapper
}


/**
 * Wraps a Tiptap Editor instance into a standardized RichTextWrapper.
 */
const createRichTextWrapper = (editor: EditorState): RichTextAdapter => {
  let editorView = null
  return {
    createTransaction: function (): RichTextTransaction { return new ProseMirrorTransaction() },
    isExtensionAvailable: function (extensionNames: string | string[]): boolean {
      throw new Error("Function not implemented.")
    },
    isEditable: function (): boolean {
      throw new Error("Function not implemented.")
    },
    isFocus: function (): boolean {
      throw new Error("Function not implemented.")
    },
    isNodeTypeSelected: function (types: string[]): boolean {
      throw new Error("Function not implemented.")
    },
    isNodeTypeInSchema: function (typeName: string): boolean {
      throw new Error("Function not implemented.")
    },
    isMarkInSchema: function (markName: string): boolean {
      throw new Error("Function not implemented.")
    },
    findNodePosition: function (node: any): number | null {
      throw new Error("Function not implemented.")
    },
    getSelectionMarkTypeList: function (): readonly any[] {
      throw new Error("Function not implemented.")
    },
    getMarkTypeInSchema: function (markName: string) {
      throw new Error("Function not implemented.")
    },
    getSelectionAttributes: function (typeOrName: string | any) {
      throw new Error("Function not implemented.")
    },
    getSelectionType: function (): "inline" | "block" | "unknown" {
      throw new Error("Function not implemented.")
    },
    getSelectionNodes: function (): RichTextNodeWrapper {
      throw new Error("Function not implemented.")
    },
    isSelectionMarkable: function (markName: string | any, attributes?: {}): boolean {
      throw new Error("Function not implemented.")
    },
    isNodeSetable: function (markName: string | any, attributes?: {}): boolean {
      throw new Error("Function not implemented.")
    },
    toggleSelectionWithMark: function (markName: string | any, attributes?: {}): boolean {
      throw new Error("Function not implemented.")
    },
    getSelection: function (): { from: number; to: number; isEmpty: boolean; $anchor?: any } {
      throw new Error("Function not implemented.")
    },
    getCursorCoord: function (): EditorCursorCoord {
      throw new Error("Function not implemented.")
    },
    createNode: function (pos: number, atNode?: any) {
      throw new Error("Function not implemented.")
    },
    getHTML: function () {
      throw new Error("Function not implemented.")
    },
    setContentFromHTML: function (htmlContent: string) {
      throw new Error("Function not implemented.")
    },
    getInternalContent: function () {
      throw new Error("Function not implemented.")
    },
    setInternalContent: function (content: any) {
      throw new Error("Function not implemented.")
    },
    on: function (event: string, callback: (...args: any[]) => void) {
      throw new Error("Function not implemented.")
    },
    off: function (event: string, callback: (...args: any[]) => void) {
      throw new Error("Function not implemented.")
    },

    mount: function (element: HTMLElement) {
      if (typeof document === 'undefined') throw new Error(`[prosemirror-tiptap error]: The editor cannot be mounted because there is no 'document' defined in this environment.`,)


    },
    unmount: function () {
      throw new Error("Function not implemented.")
    },
    destroy: function () {
      throw new Error("Function not implemented.")
    },
    isDestroyed: function (): boolean {
      throw new Error("Function not implemented.")
    }
  }
}

// due to the injected content will break the inner model of prosemirror (handling content even if the node/mark is not defined in the content) 
function createProsemirrorDocument(content: string | Content, schema: Schema, plugins: readonly Plugin[]): { doc: Node, newSchema: Schema, newPlugins: readonly Plugin[] } {
  let doc: Node
  try {
    doc = createDocument(content, schema, {}, { errorOnInvalidContent: true, })
    return { doc, newSchema: schema, newPlugins: plugins };
  } catch (e) {
    if (!(e instanceof Error) || !['[prosemirror-tiptap error]: Invalid JSON content', '[tiptap error]: Invalid HTML content'].includes(e.message)) { throw e }
    const { schema: newSchema, plugins: newPlugins } = getProsemirrorPropsFromTiptapLegacy(true)
    doc = createDocument(content, newSchema, {}, { errorOnInvalidContent: false, })
    return { doc, newSchema, newPlugins };
  }
}