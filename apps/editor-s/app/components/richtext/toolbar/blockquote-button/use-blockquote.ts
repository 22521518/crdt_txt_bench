"use client"

import * as React from "react"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { BlockquoteIcon } from "@/components/tiptap-icons/blockquote-icon"

// --- UI Utils ---
import { checkEditorMarkNodeActive, isValidPosition, type RichTextWrapper } from "@/libs/richtext"

export const BLOCKQUOTE_SHORTCUT_KEY = "mod+shift+b"

/**
 * Configuration for the blockquote functionality
 */
export interface UseBlockquoteConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * Whether the button should hide when blockquote is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful toggle.
   */
  onToggled?: () => void
}

/**
 * Checks if blockquote can be toggled in the current editor state
 */
export function canToggleBlockquote(
  editor: RichTextWrapper | null,
  turnInto: boolean = true
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (
    !editor.isNodeTypeInSchema("blockquote") ||
    editor.isNodeTypeSelected(["image"])
  )
    return false

  if (!turnInto) {
    return editor.createTransaction().isWrapTogglable("blockquote")
  }

  try {
    const { isEmpty, $anchor } = editor.getSelection()

    // No selection, find the the cursor position
    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor?.node(1))
      if (!isValidPosition(pos)) return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Toggles blockquote formatting for a specific node or the current selection
 */
export function toggleBlockquote(editor: RichTextWrapper | null): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canToggleBlockquote(editor)) return false

  try {
    const { isEmpty, $anchor, from: selectionFrom, to: selectionTo } = editor.getSelection()

    // No selection, find the the cursor position
    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor?.node(1))
      if (!isValidPosition(pos)) return false
      const newNode = editor.createNode(pos!)
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

    const isBlockquoteActive = checkEditorMarkNodeActive(editor, "blockquote")
    const flag = isBlockquoteActive
      ? chain.lift?.("blockquote").commit()
      : chain.wrapIn?.("blockquote").commit()

    editor.createTransaction().focus().selectTextblockEnd().commit()

    return flag ?? false
  } catch {
    return false
  }
}

/**
 * Determines if the blockquote button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isNodeTypeInSchema("blockquote")) return false

  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canToggleBlockquote(editor)
  }

  return true
}

/**
 * Custom hook that provides blockquote functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage - no params needed
 * function MySimpleBlockquoteButton() {
 *   const { isVisible, handleToggle, isActive } = useBlockquote()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleToggle}>Blockquote</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedBlockquoteButton() {
 *   const { isVisible, handleToggle, label, isActive } = useBlockquote({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onToggled: () => console.log('Blockquote toggled!')
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
 *       Toggle Blockquote
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useBlockquote(config?: UseBlockquoteConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onToggled,
  } = config || {}

  const contextEditor = useCurrentEditor()
  const editor = providedEditor ?? contextEditor
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const [canToggle, setCanToggle] = React.useState<boolean>(false)
  const [isActive, setIsActive] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!editor) {
      setIsActive(false)
      return
    }

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
      setCanToggle(canToggleBlockquote(editor))
      setIsActive(checkEditorMarkNodeActive(editor, "blockquote"))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)
    editor.on("transaction", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
      editor.off("transaction", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleToggle = React.useCallback(() => {
    if (!editor) return false

    const success = toggleBlockquote(editor)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, onToggled])

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle,
    label: "Blockquote",
    shortcutKeys: BLOCKQUOTE_SHORTCUT_KEY,
    Icon: BlockquoteIcon,
  }
}
