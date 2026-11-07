"use client"

import * as React from "react"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Lib ---
// import { findNodePosition, } from "@/libs/components.utils"

// --- Icons ---
import { HeadingOneIcon } from "@/components/tiptap-icons/heading-one-icon"
import { HeadingTwoIcon } from "@/components/tiptap-icons/heading-two-icon"
import { HeadingThreeIcon } from "@/components/tiptap-icons/heading-three-icon"
import { HeadingFourIcon } from "@/components/tiptap-icons/heading-four-icon"
import { HeadingFiveIcon } from "@/components/tiptap-icons/heading-five-icon"
import { HeadingSixIcon } from "@/components/tiptap-icons/heading-six-icon"
import { isValidPosition, type RichTextWrapper } from "@/libs/richtext"

export type Level = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Configuration for the heading functionality
 */
export interface UseHeadingConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * The heading level.
   */
  level: Level
  /**
   * Whether the button should hide when heading is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful heading toggle.
   */
  onToggled?: () => void
}

export const headingIcons = {
  1: HeadingOneIcon,
  2: HeadingTwoIcon,
  3: HeadingThreeIcon,
  4: HeadingFourIcon,
  5: HeadingFiveIcon,
  6: HeadingSixIcon,
}

export const HEADING_SHORTCUT_KEYS: Record<Level, string> = {
  1: "ctrl+alt+1",
  2: "ctrl+alt+2",
  3: "ctrl+alt+3",
  4: "ctrl+alt+4",
  5: "ctrl+alt+5",
  6: "ctrl+alt+6",
}

/**
 * Checks if heading can be toggled in the current editor state
 */
export function canToggle(
  editor: RichTextWrapper | null,
  level?: Level,
  turnInto: boolean = true
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (
    !editor.isNodeTypeInSchema("heading") ||
    editor.isNodeTypeSelected(["image"])
  )
    return false

  if (!turnInto) {
    return level
      ? editor.isNodeSetable("heading", { level })
      : editor.isNodeSetable("heading")
  }

  try {
    // const view = editor.view
    // const state = view.state
    // const selection = state.selection
    const { isEmpty, $anchor } = editor.getSelection()

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
 * Checks if heading is currently active
 */
export function isHeadingActive(
  editor: RichTextWrapper | null,
  level?: Level | Level[]
): boolean {
  if (!editor || !editor.isEditable()) return false

  if (Array.isArray(level)) {
    return level.some((l) => editor.isSelectedNodeTypeActive?.("heading", { level: l }))
  }

  return level
    ? editor.isSelectedNodeTypeActive?.("heading", { level }) ?? false
    : editor.isSelectedNodeTypeActive?.("heading") ?? false
}

/**
 * Toggles heading in the editor
 */
export function toggleHeading(
  editor: RichTextWrapper | null,
  level: Level | Level[]
): boolean {
  if (!editor || !editor.isEditable()) return false

  const levels = Array.isArray(level) ? level : [level]
  const toggleLevel = levels.find((l) => canToggle(editor, l))
  if (!toggleLevel) return false

  try {
    const { isEmpty, $anchor, from: selectionFrom, to: selectionTo } = editor.getSelection()

    // No selection, find the cursor position
    if (isEmpty || editor.getSelectionType() == 'inline') {
      const pos = editor.findNodePosition($anchor?.node(1))
      if (!isValidPosition(pos)) return false
      const newNode = editor.createNode(pos)
      editor.createTransaction().setNodeSelection(newNode).commit()
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

    const isActive = levels.some((l) => editor.isSelectedNodeTypeActive?.("heading", { level: l }))
    const toggle = isActive ? chain.setNode("paragraph") : chain.setNode("heading", { level: toggleLevel })
    toggle.commit()
    editor.createTransaction().focus().selectTextblockEnd().commit()

    return true
  } catch {
    return false
  }
}

/**
 * Determines if the heading button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  level?: Level | Level[]
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, level, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isNodeTypeInSchema("heading")) return false

  if (hideWhenUnavailable && !editor.isSelectedNodeTypeActive?.("code")) {
    if (Array.isArray(level)) {
      return level.some((l) => canToggle(editor, l))
    }
    return canToggle(editor, level)
  }

  return true
}

/**
 * Custom hook that provides heading functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleHeadingButton() {
 *   const { isVisible, isActive, handleToggle, Icon } = useHeading({ level: 1 })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <button
 *       onClick={handleToggle}
 *       aria-pressed={isActive}
 *     >
 *       <Icon />
 *       Heading 1
 *     </button>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedHeadingButton() {
 *   const { isVisible, isActive, handleToggle, label, Icon } = useHeading({
 *     level: 2,
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onToggled: (isActive) => console.log('Heading toggled:', isActive)
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
 *       <Icon />
 *       Toggle Heading 2
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useHeading(config: UseHeadingConfig) {
  const {
    editor: providedEditor,
    level,
    hideWhenUnavailable = false,
    onToggled,
  } = config

  // const { editor } = useTiptapEditor(providedEditor)

  let editor = providedEditor ?? useCurrentEditor()

  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const canToggleState = canToggle(editor, level)
  const isActive = isHeadingActive(editor, level)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, level, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on?.("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off?.("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, level, hideWhenUnavailable])

  const handleToggle = React.useCallback(() => {
    if (!editor) return false

    const success = toggleHeading(editor, level)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, level, onToggled])

  return {
    isVisible,
    isActive,
    handleToggle,
    canToggle: canToggleState,
    label: `Heading ${level}`,
    shortcutKeys: HEADING_SHORTCUT_KEYS[level],
    Icon: headingIcons[level],
  }
}
