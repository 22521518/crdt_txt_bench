"use client"

import * as React from "react"
// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"


// --- Icons ---
import { CodeBlockIcon } from "@/components/tiptap-icons/code-block-icon"
import { checkEditorMarkNodeActive, isValidPosition, type RichTextAdapter } from "@/adapters/richtext-adapter"

export const CODE_BLOCK_SHORTCUT_KEY = "mod+alt+c"

/**
 * Configuration for the code block functionality
 */
export interface UseCodeBlockConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextAdapter | null
  /**
   * Whether the button should hide when code block is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful code block toggle.
   */
  onToggled?: () => void
}

/**
 * Checks if code block can be toggled in the current editor state
 */
export function canToggle(
  editor: RichTextAdapter | null,
  turnInto: boolean = true
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (
    !editor.isNodeTypeInSchema("codeBlock") ||
    editor.isNodeTypeSelected(["image"])
  )
    return false

  if (!turnInto) {
    return editor.createTransaction().isNodeTogglable("codeBlock", "paragraph")
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
 * Toggles code block in the editor
 */
export function toggleCodeBlock(editor: RichTextAdapter | null): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canToggle(editor)) return false

  try {
    const { isEmpty, $anchor, from: selectionFrom, to: selectionTo } = editor.getSelection()

    // No selection, find the cursor position
    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor?.node(1))
      if (!isValidPosition(pos)) return false
      const newNode = editor.createNode(pos)
      editor.createTransaction().setNode(newNode).commit()
      // editor.createTransaction().setNodeSelection(newNode).commit()
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

    const isCodeBlockActive = checkEditorMarkNodeActive(editor, "codeBlock")
    const toggle = isCodeBlockActive
      ? chain.setNode("paragraph")
      : chain.toggleNode("codeBlock", "paragraph")

    const flag = toggle.commit()
    editor.createTransaction().focus().selectTextblockEnd().commit()

    return flag
  } catch {
    return false
  }
}

/**
 * Determines if the code block button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextAdapter | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isNodeTypeInSchema("codeBlock")) return false

  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canToggle(editor)
  }

  return true
}

/**
 * Custom hook that provides code block functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage - no params needed
 * function MySimpleCodeBlockButton() {
 *   const { isVisible, isActive, handleToggle } = useCodeBlock()
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <button
 *       onClick={handleToggle}
 *       aria-pressed={isActive}
 *     >
 *       Code Block
 *     </button>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedCodeBlockButton() {
 *   const { isVisible, isActive, handleToggle, label } = useCodeBlock({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onToggled: (isActive) => console.log('Code block toggled:', isActive)
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
 *       Toggle Code Block
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useCodeBlock(config?: UseCodeBlockConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onToggled,
  } = config || {}

  const contextEditor = useCurrentEditor()
  const editor = providedEditor ?? contextEditor
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const [canToggleState, setCanToggleState] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    if (!editor) {
      setIsActive(false)
      return
    }

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
      setCanToggleState(() => canToggle(editor))
      setIsActive(checkEditorMarkNodeActive(editor!, "codeBlock"))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleToggle = React.useCallback(() => {
    if (!editor) return false

    const success = toggleCodeBlock(editor)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, onToggled])

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle: canToggleState,
    label: "Code Block",
    shortcutKeys: CODE_BLOCK_SHORTCUT_KEY,
    Icon: CodeBlockIcon,
  }
}
