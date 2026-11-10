import React from "react"
import { Node, Schema } from "@tiptap/pm/model"
import { NodeSelection, PluginKey, Plugin, TextSelection, AllSelection } from "@tiptap/pm/state"
import { Editor, type EditorOptions } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Highlight } from "@tiptap/extension-highlight"
import { TextAlign } from "@tiptap/extension-text-align"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"

import { type RichTextWrapper, RichTextSingleton } from "@/libs/richtext"
import type { RichTextEditorFactory, EditorFactoryOptions } from "@/libs/editor-factory"
import { handleMobileEnter } from "./handle-mobile-enter"
import { TiptapTransaction } from "./tiptap-transaction"

import defaultContent from "./data/content.json"

const mobileEnterPluginKey = new PluginKey("reactMobileEnter")

export type TiptapEditorOptions = Partial<Omit<EditorOptions, "content">> & EditorFactoryOptions & {
  initialContent?: any
  content?: any
  setAsSingleton?: boolean
}

export function getDefaultExtensions() {
  return [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Superscript,
    Subscript,
  ]
}

export function getDefaultEditorProps() {
  return {
    attributes: {
      autocomplete: "off",
      autocorrect: "off",
      autocapitalize: "off",
      "aria-label": "Main content area, start typing to enter text.",
      class: "richtxt-editor",
    },
  }
}

/**
 * Wraps a Tiptap Editor instance into a standardized RichTextWrapper.
 */
export const createRichTextWrapper = (
  editor: Editor | null
): RichTextWrapper => {
  return {
    editor: editor ?? undefined,

    createTransaction() {
      if (!editor) throw new Error("The tiptap editor is not initialized yet!")
      return new TiptapTransaction(editor)
    },

    isExtensionAvailable(extensionNames: string | string[]) {
      if (!editor) return false
      const names = Array.isArray(extensionNames) ? extensionNames : [extensionNames]
      const found = names.some((name) => editor.extensionManager.extensions.some((ext) => ext.name === name))
      if (!found) {
        console.warn(`None of the extensions [${names.join(", ")}] were found in the editor schema. Ensure they are included in the editor configuration.`)
      }
      return found
    },

    isFocus() {
      return !editor || editor.isDestroyed || !editor.view ? false : (editor.view.hasFocus() ?? false)
    },

    isEditable() {
      return editor?.isEditable ?? false
    },

    isNodeTypeSelected(types: string[]) {
      if (!editor || !editor.state.selection) return false
      if (editor.state.selection.empty) return false
      const selection = editor.state.selection
      if (selection instanceof NodeSelection) {
        return selection.node ? types.includes(selection.node.type.name) : false
      }
      return false
    },

    isSelectedNodeTypeActive(name: string | null, attributes?: {}) {
      return (name ? editor?.isActive(name, attributes) : editor?.isActive(attributes ?? {})) ?? false
    },

    isMarkActive(name: string | null, attributes?: {}) {
      return (name ? editor?.isActive(name, attributes) : editor?.isActive(attributes ?? {})) ?? false
    },

    isNodeTypeInSchema(typeName: string) {
      return editor?.schema ? editor.schema.spec.nodes.get(typeName) !== undefined : false
    },

    isMarkInSchema(markName: string) {
      return editor?.schema ? editor.schema.spec.marks.get(markName) !== undefined : false
    },

    findNodePosition(node: any) {
      if (!editor || !editor.state?.doc) return null
      if (node === undefined || node === null) return null
      let foundPos = -1
      let foundNode: Node | null = null

      editor.state.doc.descendants((currentNode, pos) => {
        if (currentNode === node) {
          foundPos = pos
          foundNode = currentNode
          return false
        }
        return true
      })

      if (foundPos !== -1 && foundNode !== null) {
        return foundPos
      }
      return null
    },

    getSelectionMarkTypeList() {
      return editor?.state.storedMarks ?? []
    },

    getMarkTypeInSchema(markName: string) {
      return editor?.schema.marks[markName]
    },

    getSelectionAttributes(typeOrName: string | any) {
      if (!editor) return {}
      const schemaType = getSchemaTypeNameByName(
        typeof typeOrName === "string" ? typeOrName : typeOrName.name,
        editor.state.schema
      )
      if (schemaType === "node") return getSelectionNodeTypeAttributes(editor, typeOrName)
      if (schemaType === "mark") return getSelectionMarkAttributes(editor, typeOrName)
      return {}
    },

    getSelectionType() {
      if (editor?.view?.state?.selection instanceof TextSelection) return "inline"
      if (editor?.view?.state?.selection instanceof NodeSelection) return "block"
      if (editor?.view?.state?.selection instanceof AllSelection) return "block"
      return "unknown"
    },

    getSelectionNodes() {
      if (editor?.view?.state?.selection instanceof NodeSelection) {
        const selectionNode = editor.view.state.selection.node
        return createRichTextNodeWrapper(selectionNode)
      }
      return { getChildren() { return [] }, getLength() { return 0 } }
    },

    isSelectionMarkable(markName: string | any, attributes?: {}) {
      return editor?.can().setMark(markName, attributes) ?? false
    },

    isNodeSetable(markName: string | any, attributes?: {}) {
      return editor?.can().setNode(markName, attributes) ?? false
    },

    toggleSelectionWithMark(markName: string | any, attributes?: {}) {
      return editor?.chain().focus().toggleMark(markName, attributes).run() ?? false
    },

    getSelection() {
      if (!editor) return { from: 0, to: 0, isEmpty: true, $anchor: null }
      const { from, to, empty, $anchor } = editor.state.selection
      return { from, to, isEmpty: empty, $anchor }
    },

    getCursorCoord() {
      if (!editor || !this.isFocus() || !editor.view) {
        return { left: 0, right: 0, top: 0, bottom: 0 }
      }
      return editor.view.coordsAtPos(editor.state.selection.from)
    },

    createNode(pos: number, atNode?: any) {
      return NodeSelection.create(atNode ?? editor?.state.doc, pos)
    },

    undoable() {
      return editor?.can().undo() ?? false
    },

    redoable() {
      return editor?.can().redo() ?? false
    },

    undo() {
      return editor?.chain().focus().undo().run() ?? false
    },

    redo() {
      return editor?.chain().focus().redo().run() ?? false
    },

    getHTML() {
      return editor?.getHTML() ?? ""
    },

    setContentFromHTML(htmlContent: string) {
      editor?.commands.setContent(htmlContent)
    },

    getInternalContent() {
      return editor?.getJSON() ?? { type: "doc", content: [] }
    },

    setInternalContent(content: any) {
      editor?.commands.setContent(content)
    },

    on(event: string, callback: (...args: any[]) => void) {
      editor?.on(event as any, callback)
    },

    off(event: string, callback: (...args: any[]) => void) {
      editor?.off(event as any, callback)
    },

    doBeforeMount() {},

    mount(element: HTMLElement) {
      if (!editor || editor.isDestroyed) return

      if (editor.view?.dom?.parentNode) {
        element.append(...editor.view.dom.parentNode.childNodes)
        editor.setOptions({ element })
        editor.createNodeViews()
      } else {
        editor.mount(element)
      }
    },

    doAfterMount() {
      if (!editor || editor.isDestroyed) return

      editor.registerPlugin(
        new Plugin({
          key: mobileEnterPluginKey,
          props: {
            handleDOMEvents: {
              beforeinput: (_view, event) => handleMobileEnter(editor, event),
            },
          },
        })
      )
    },

    doBeforeUnmount() {
      if (!editor?.isDestroyed) {
        editor?.unregisterPlugin(mobileEnterPluginKey)
        editor?.view?.setProps({ nodeViews: {} })
      }
    },

    unmount() {
      if (!editor || editor.isDestroyed) return

      try {
        if (!editor.view?.dom?.parentNode) return
        const newElement = document.createElement("div")
        newElement.append(...editor.view.dom.parentNode.childNodes)
        editor.setOptions({ element: newElement })
      } catch {
        // do nothing
      }
    },

    doAfterUnmount() {},

    destroy() {
      editor?.destroy()
    },

    isDestroyed() {
      return !editor || editor.isDestroyed
    },
  }
}

/**
 * Factory method to instantiate a Tiptap editor wrapped in RichTextWrapper.
 */
export const createTiptapEditor = (options?: TiptapEditorOptions): RichTextWrapper => {
  const editor = new Editor({
    extensions: options?.extensions ?? getDefaultExtensions(),
    content: options?.initialContent ?? options?.content ?? defaultContent,
    editorProps: {
      ...getDefaultEditorProps(),
      ...options?.editorProps,
      attributes: {
        ...getDefaultEditorProps().attributes,
        ...options?.editorProps?.attributes,
      },
    },
    ...options,
  })

  const wrapper = createRichTextWrapper(editor)

  if (options?.setAsSingleton) {
    RichTextSingleton.setInstance(wrapper)
  }

  return wrapper
}

/**
 * Concrete factory implementing RichTextEditorFactory for Tiptap.
 */
export const tiptapEditorFactory: RichTextEditorFactory<TiptapEditorOptions> = {
  name: "tiptap",
  createEditor(options?: TiptapEditorOptions) {
    return createTiptapEditor(options)
  },
}

// Auto-register Tiptap as the default editor factory for the Singleton
RichTextSingleton.registerDefaultFactory(tiptapEditorFactory)

/**
 * Backward compatibility alias for createTiptapEditor.
 */
export const createTipTapEditor = (initialContent?: string) => {
  return createTiptapEditor({ initialContent })
}

/**
 * React hook to create and manage the lifecycle of a Tiptap editor.
 * Cleans up and destroys the editor on unmount.
 */
export function useTiptapEditor(
  options?: TiptapEditorOptions,
  deps: React.DependencyList = []
): RichTextWrapper | null {
  const [editor, setEditor] = React.useState<RichTextWrapper | null>(() => {
    if (typeof window === "undefined") return null
    return createTiptapEditor(options)
  })

  React.useEffect(() => {
    let currentEditor = editor
    if (!currentEditor && typeof window !== "undefined") {
      currentEditor = createTiptapEditor(options)
      setEditor(currentEditor)
    }

    if (options?.setAsSingleton && currentEditor) {
      RichTextSingleton.setInstance(currentEditor)
    }

    return () => {
      if (options?.setAsSingleton && RichTextSingleton.getInstance() === currentEditor) {
        RichTextSingleton.setInstance(null)
      }
      currentEditor?.destroy()
    }
  }, deps)

  return editor
}

/**
 * Backward compatibility alias for useTiptapEditor.
 */
export const useCreateTipTapEditor = (initialContent?: string): RichTextWrapper | null => {
  return useTiptapEditor({ initialContent })
}

function getSchemaTypeNameByName(name: string, schema: Schema) {
  if (schema.nodes[name]) return "node"
  if (schema.marks[name]) return "mark"
  return null
}

function getSelectionMarkAttributes(editor: Editor, markName: string | any) {
  if (!editor) return {}
  const type = typeof markName === "string" ? editor.state.schema.marks[markName] : markName
  if (!type) throw Error(`There is no mark type named '${markName}'. Maybe you forgot to add the extension?`)
  const { from, to, empty } = editor.state.selection
  const marks = []

  if (empty) {
    if (editor.state.storedMarks) marks.push(...editor.state.storedMarks)
    marks.push(...editor.state.selection.$head.marks())
  } else {
    editor.state.doc.nodesBetween(from, to, (node) => {
      marks.push(...node.marks)
    })
  }
  const mark = marks.find((markItem) => markItem.type.name === type.name)
  return mark ? { ...mark.attrs } : {}
}

function getSelectionNodeTypeAttributes(editor: Editor, typeName: string | any) {
  if (!editor) return {}
  const type = typeof typeName === "string" ? editor.state.schema.marks[typeName] : typeName
  if (!type) throw Error(`There is no node type named '${typeName}'. Maybe you forgot to add the extension?`)
  const { from, to } = editor.state.selection
  const nodes: Node[] = []
  editor.state.doc.nodesBetween(from, to, (n: Node) => {
    nodes.push(n)
  })
  const node = nodes.reverse().find((nodeItem) => nodeItem.type.name === type.name)
  return node ? { ...node.attrs } : {}
}

function createRichTextNodeWrapper(node: Node) {
  return {
    getChildren() {
      return node.children.map((child: Node) => createRichTextNodeWrapper(child))
    },
    getLength() {
      return node.childCount
    },
  }
}
