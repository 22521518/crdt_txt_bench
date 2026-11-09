"use client"

import * as React from "react"
// import { NodeSelection, TextSelection } from "@tiptap/pm/state"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { ListIcon } from "@/components/tiptap-icons/list-icon"
import { ListOrderedIcon } from "@/components/tiptap-icons/list-ordered-icon"
import { ListTodoIcon } from "@/components/tiptap-icons/list-todo-icon"

// --- Lib ---
import { checkEditorMarkNodeActive, isValidPosition, type RichTextWrapper } from "@/libs/richtext"

export type ListType = "bulletList" | "orderedList" | "taskList"

/**
 * Configuration for the list functionality
 */
export interface UseListConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * The type of list to toggle.
   */
  type: ListType
  /**
   * Whether the button should hide when list is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful toggle.
   */
  onToggled?: () => void
}

export const listIcons = {
  bulletList: ListIcon,
  orderedList: ListOrderedIcon,
  taskList: ListTodoIcon,
}

export const listLabels: Record<ListType, string> = {
  bulletList: "Bullet List",
  orderedList: "Ordered List",
  taskList: "Task List",
}

export const LIST_SHORTCUT_KEYS: Record<ListType, string> = {
  bulletList: "mod+shift+8",
  orderedList: "mod+shift+7",
  taskList: "mod+shift+9",
}

/**
 * Checks if a list can be toggled in the current editor state
 */
export function canToggleList(
  editor: RichTextWrapper | null,
  type: ListType,
  turnInto: boolean = true
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!editor.isNodeTypeInSchema(type) || editor.isNodeTypeSelected(["image"]))
    return false

  if (!turnInto) {
    switch (type) {
      case "bulletList":
        return editor.createTransaction().isBulletListTogglable()
      case "orderedList":
        return editor.createTransaction().isOrderedListTogglable()
      case "taskList":
        return editor.createTransaction().isTaskListTogglable()
      default:
        return false
    }
  }

  try {
    const { isEmpty, $anchor } = editor.getSelection()

    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor?.node(1))
      return isValidPosition(pos)
    }

    return true
  } catch {
    return false
  }
}

/**
 * Checks if list is currently active
 */
export function isListActive(editor: RichTextWrapper | null, type: ListType): boolean {
  if (!editor || !editor.isEditable()) return false

  switch (type) {
    case "bulletList":
      return checkEditorMarkNodeActive(editor, "bulletList")
    case "orderedList":
      return checkEditorMarkNodeActive(editor, "orderedList")
    case "taskList":
      return checkEditorMarkNodeActive(editor, "taskList")
    default:
      return false
  }
}

/**
 * Toggles list in the editor
 */
export function toggleList(editor: RichTextWrapper | null, type: ListType): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canToggleList(editor, type)) return false

  try {
    const { isEmpty, $anchor, from: selectionFrom, to: selectionTo } = editor.getSelection()

    // No selection, find the the cursor position
    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor.node(1))
      if (!isValidPosition(pos)) return false

      const newNode = editor.createNode(pos)
      editor.createTransaction().setNode(newNode).commit()
    }

    let chain = editor.createTransaction().focus()

    // Handle NodeSelection
    if (editor.getSelectionType() == 'block') {
      const selectionNode = editor.getSelectionNodes()
      const selectionNodeChildrenLen = selectionNode.getLength()
      const firstChild = selectionNodeChildrenLen > 0 ? selectionNode.getChildren()[0] : undefined
      const lastChild = selectionNodeChildrenLen > 0 ? selectionNode.getChildren()[selectionNodeChildrenLen - 1] : undefined

      const from = firstChild ? selectionFrom + firstChild.getLength() : selectionFrom + 1
      const to = lastChild ? selectionTo - lastChild.getLength() : selectionTo - 1
      chain = chain.setTextSelection(from, to).clearNodes()
    }

    if (checkEditorMarkNodeActive(editor, type) && chain.liftListItem && chain.lift) {
      // Unwrap list
      chain.liftListItem?.("listItem")
        .lift?.("bulletList")
        .lift?.("orderedList")
        .lift?.("taskList")
        .commit()
    } else {
      // Wrap in specific list type
      const toggleMap: Record<ListType, () => typeof chain> = {
        bulletList: () => chain.toggleBulletList?.() ?? chain,
        orderedList: () => chain.toggleOrderedList?.() ?? chain,
        taskList: () => chain.toggleTaskList?.() ?? chain,
        // taskList: () => chain.toggleTaskList?.("taskList", "taskItem") ?? chain,
      }

      const toggle = toggleMap[type]
      if (!toggle) return false

      toggle().commit()
    }

    editor.createTransaction().focus().selectTextblockEnd().commit()

    return true
  } catch {
    return false
  }
}

/**
 * Determines if the list button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  type: ListType
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, type, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isNodeTypeInSchema(type)) return false

  if (hideWhenUnavailable && !checkEditorMarkNodeActive(editor, "code")) {
    return canToggleList(editor, type)
  }

  return true
}

/**
 * Custom hook that provides list functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleListButton() {
 *   const { isVisible, handleToggle, isActive } = useList({ type: "bulletList" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleToggle}>Bullet List</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedListButton() {
 *   const { isVisible, handleToggle, label, isActive } = useList({
 *     type: "orderedList",
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onToggled: () => console.log('List toggled!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleToggle}
 *       aria-label={label}
 *       aria-pressed={isActive}
 *     >
 *       Toggle List
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useList(config: UseListConfig) {
  const {
    editor: providedEditor,
    type,
    hideWhenUnavailable = false,
    onToggled,
  } = config

  const editor = providedEditor ?? useCurrentEditor()
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const canToggle = canToggleList(editor, type)
  const isActive = isListActive(editor, type)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, type, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, type, hideWhenUnavailable])

  const handleToggle = React.useCallback(() => {
    if (!editor) return false

    const success = toggleList(editor, type)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, type, onToggled])

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle,
    label: listLabels[type],
    shortcutKeys: LIST_SHORTCUT_KEYS[type],
    Icon: listIcons[type],
  }
}
