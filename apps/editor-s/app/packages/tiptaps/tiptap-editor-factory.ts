import type { RichTextWrapper } from "@/libs/richtext"
import { NodeSelection, PluginKey, Plugin } from "@tiptap/pm/state"
import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useTiptapEditor } from "./use-tiptap-editor"
import { handleMobileEnter } from "./handle-mobile-enter"
import React from "react"

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
    extensions: getExtension(),
    content: initialContent,
  })

  return React.useMemo<RichTextWrapper>(() => ({
    editor: editor,
    useEditorState() { return useTiptapEditor(editor) },
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

    isSelectionMarkable(markName: string) { return editor?.can().setMark(markName) ?? false },
    setSelectionWithMark(markName: string) { return editor?.chain().focus().setMark(markName).run() ?? false },
    unsetSelectionWithMark(markName: string) { return editor?.chain().focus().unsetMark(markName).run() ?? false },

    getCursorCoord() {
      if (!editor || !this.isFocus() || !editor.view) return { left: 0, right: 0, top: 0, bottom: 0 }
      return editor.view.coordsAtPos(editor.state.selection.from)
    },

    undoable() { return editor?.can().undo() ?? false },
    redoable() { return editor?.can().redo() ?? false },
    undo() { return editor?.chain().focus().undo().run() ?? false },
    redo() { return editor?.chain().focus().redo().run() ?? false },

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

function getExtension() {
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
    // Highlight.configure({ multicolor: true }),
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
