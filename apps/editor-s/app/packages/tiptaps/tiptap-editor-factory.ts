import type { RichTextWrapper } from "@/libs/richtext"
import { NodeSelection, PluginKey, Plugin } from "@tiptap/pm/state"
import { Editor, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Highlight } from "@tiptap/extension-highlight"
import { handleMobileEnter } from "./handle-mobile-enter"
import React from "react"
import { Node, Schema } from "@tiptap/pm/model"
import { TiptapTransaction } from "./tiptap-transaction"

const mobileEnterPluginKey = new PluginKey('reactMobileEnter')

export const useCreateTipTapEditor = (initialContent?: string): RichTextWrapper => {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "richtxt-editor",
      },
    },
    extensions: getExtensions(),
    content: initialContent,
  })

  return React.useMemo<RichTextWrapper>(() => ({
    editor: editor,
    createTransaction() {
      if (!editor) throw new Error("The tiptap editor is initialized yet!")
      return new TiptapTransaction(editor)
    },

    isFocus() { return !editor || editor.isDestroyed || !editor.view ? false : (editor.view.hasFocus() ?? false) },

    isEditable() { return editor?.isEditable ?? false },
    isNodeTypeSelected(types: string[]) {
      if (!editor || !editor.state.selection) return false
      if (editor.state.selection.empty) return false
      const selection = editor.state
      if (selection instanceof NodeSelection) return selection.node ? types.includes(selection.node.type.name) : false
      return false
    },
    isSelectedNodeTypeActive(name: string, attributes?: {}) { return editor?.isActive(name, attributes) ?? false },
    isNodeTypeInSchema(typeName: string) { return editor?.schema ? editor.schema.spec.nodes.get(typeName) !== undefined : false },
    isMarkInSchema(markName: string) { return editor?.schema ? editor.schema.spec.marks.get(markName) !== undefined : false },

    getSelectionMarkTypeList() { return editor?.state.storedMarks ?? [] },
    getMarkTypeInSchema(markName: string) { return editor?.schema.marks[markName] },

    getSelectionAttributes(typeOrName: string | any) {
      if (!editor) return {}
      const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, editor?.state.schema);
      if (schemaType === "node") return getSelectionNodeTypeAttributes(editor, typeOrName);
      if (schemaType === "mark") return getSelectionMarkAttributes(editor, typeOrName);
      return {};
    },

    isSelectionMarkable(markName: string | any, attributes?: {}) { return editor?.can().setMark(markName, attributes) ?? false },
    // setSelectionWithMark(markName: string | any, attributes?: {}) { return editor?.chain().focus().setMark(markName, attributes).run() ?? false },
    // unsetSelectionWithMark(markName: string | any) { return editor?.chain().focus().unsetMark(markName).run() ?? false },
    toggleSelectionWithMark(markName: string | any, attributes?: {}) { return editor?.chain().focus().toggleMark(markName, attributes).run() ?? false },

    getSelection() {
      if (!editor) return { from: 0, to: 0, isEmpty: true }
      const { from, to, empty } = editor.state.selection
      return { from: from, to: to, isEmpty: empty }
    },
    getCursorCoord() {
      if (!editor || !this.isFocus() || !editor.view) return { left: 0, right: 0, top: 0, bottom: 0 }
      return editor.view.coordsAtPos(editor.state.selection.from)
    },

    undoable() { return editor?.can().undo() ?? false },
    redoable() { return editor?.can().redo() ?? false },
    undo() { return editor?.chain().focus().undo().run() ?? false },
    redo() { return editor?.chain().focus().redo().run() ?? false },

    getContent() { return editor?.getHTML() ?? "" },
    setContent(content: any) { editor?.commands.setContent(content) },

    on(event: string, callback: (...args: any[]) => void) {
      editor?.on(event as any, callback)
    },
    off(event: string, callback: (...args: any[]) => void) {
      editor?.off(event as any, callback)
    },

    doBeforeMount() { },
    mount(element: HTMLElement) {
      if (!editor || editor.isDestroyed) return

      if (editor.view?.dom?.parentNode) {
        element.append(...editor.view.dom.parentNode.childNodes)
        editor.setOptions({
          element,
        })
        editor.createNodeViews()
      } else {
        editor.mount(element)
      }
    },
    doAfterMount() {
      if (!editor?.isDestroyed) {
        editor?.registerPlugin(new Plugin({
          key: mobileEnterPluginKey,
          props: {
            handleDOMEvents: {
              beforeinput: (_view, event) => handleMobileEnter(editor, event),
            },
          },
        }))
      }
    },

    doBeforeUnmount() {
      if (!editor?.isDestroyed) {
        editor?.unregisterPlugin(mobileEnterPluginKey)
        editor?.view?.setProps({
          nodeViews: {},
        })
      }
    },
    unmount() {
      if (!editor || editor.isDestroyed) return

      try {
        if (!editor.view?.dom?.parentNode) return

        const newElement = document.createElement('div')
        newElement.append(...editor.view.dom.parentNode.childNodes)
        editor.setOptions({
          element: newElement,
        })
      } catch {
        // do nothing
      }
    },
    doAfterUnmount() { },

    destroy() { editor?.destroy() },
    isDestroyed() { return !editor || editor.isDestroyed },
  }), [editor])
}

function getExtensions() {
  return [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    // HorizontalRule,
    // TextAlign.configure({ types: ["heading", "paragraph"] }),
    // TaskList,
    // TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    // Image,
    // Typography,
    // Superscript,
    // Subscript,
    // Selection,
    // ImageUploadNode.configure({
    //   accept: "image/*",
    //   maxSize: MAX_FILE_SIZE,
    //   limit: 3,
    //   upload: handleImageUpload,
    //   onError: (error) => console.error("Upload failed:", error),
    // }),
  ]
}

function getSchemaTypeNameByName(name: string, schema: Schema) {
  if (schema.nodes[name]) return "node";
  if (schema.marks[name]) return "mark";
  return null;
}


function getSelectionMarkAttributes(editor: Editor, markName: string | any) {
  if (!editor) return {}
  const type = typeof markName === 'string' ? editor?.state.schema.marks[markName] : markName
  if (!type) throw Error(`There is no mark type named '${markName}'. Maybe you forgot to add the extension?`);
  const { from, to, empty } = editor?.state.selection;
  const marks = [];

  if (empty) {
    if (editor.state.storedMarks) marks.push(...editor.state.storedMarks);
    marks.push(...editor.state.selection.$head.marks());
  } else {
    editor.state.doc.nodesBetween(from, to, (node) => { marks.push(...node.marks) });
  }
  const mark = marks.find((markItem) => markItem.type.name === type.name);
  return mark ? { ...mark.attrs } : {};

}

function getSelectionNodeTypeAttributes(editor: Editor, typeName: string | any) {
  if (!editor) return {}
  const type = typeof typeName === 'string' ? editor?.state.schema.marks[typeName] : typeName
  if (!type) throw Error(`There is no node type named '${typeName}'. Maybe you forgot to add the extension?`);
  const { from, to } = editor.state.selection;
  const nodes: Node[] = [];
  editor.state.doc.nodesBetween(from, to, (n: Node) => { nodes.push(n) });
  const node = nodes.reverse().find((nodeItem) => nodeItem.type.name === type.name);
  return node ? { ...node.attrs } : {};
}