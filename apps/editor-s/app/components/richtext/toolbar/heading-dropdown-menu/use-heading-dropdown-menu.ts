"use client"

import * as React from "react"

// --- Hooks ---
// import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { HeadingIcon } from "@/components/tiptap-icons/heading-icon"

// --- Tiptap UI ---
import { headingIcons, type Level, isHeadingActive, canToggle, shouldShowButton, } from "@/components/richtext/toolbar/heading-button"
import type { RichTextWrapper } from "@/libs/richtext"

/**
 * Configuration for the heading dropdown menu functionality
 */
export interface UseHeadingDropdownMenuConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * Available heading levels to show in the dropdown
   * @default [1, 2, 3, 4, 5, 6]
   */
  levels?: Level[]
  /**
   * Whether the dropdown should hide when headings are not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
}

/**
 * Gets the currently active heading level from the available levels
 */
export function getActiveHeadingLevel(
  editor: RichTextWrapper | null,
  levels: Level[] = [1, 2, 3, 4, 5, 6]
): Level | undefined {
  if (!editor || !editor.isEditable()) return undefined
  return levels.find((level) => isHeadingActive(editor, level))
}

/**
 * Custom hook that provides heading dropdown menu functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyHeadingDropdown() {
 *   const {
 *     isVisible,
 *     activeLevel,
 *     isAnyHeadingActive,
 *     canToggle,
 *     levels,
 *   } = useHeadingDropdownMenu()
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <DropdownMenu>
 *       // dropdown content
 *     </DropdownMenu>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedHeadingDropdown() {
 *   const {
 *     isVisible,
 *     activeLevel,
 *   } = useHeadingDropdownMenu({
 *     editor: myEditor,
 *     levels: [1, 2, 3],
 *     hideWhenUnavailable: true,
 *   })
 *
 *   // component implementation
 * }
 * ```
 */
export function useHeadingDropdownMenu(config?: UseHeadingDropdownMenuConfig) {
  const {
    editor: providedEditor,
    levels = [1, 2, 3, 4, 5, 6],
    hideWhenUnavailable = false,
  } = config || {}

  // const { editor } = useTiptapEditor(providedEditor)
  const contextEditor = useCurrentEditor()
    const editor = providedEditor ?? contextEditor
  const [isVisible, setIsVisible] = React.useState<boolean>(() =>
    shouldShowButton({ editor, hideWhenUnavailable, level: levels })
  )
  const [activeLevel, setActiveLevel] = React.useState<Level | undefined>(() =>
    getActiveHeadingLevel(editor, levels)
  )
  const [isActive, setIsActive] = React.useState<boolean>(() =>
    isHeadingActive(editor)
  )
  const [canToggleState, setCanToggleState] = React.useState<boolean>(() =>
    canToggle(editor)
  )

  React.useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setIsVisible(
        shouldShowButton({ editor, hideWhenUnavailable, level: levels })
      )
      setActiveLevel(getActiveHeadingLevel(editor, levels))
      setIsActive(isHeadingActive(editor))
      setCanToggleState(canToggle(editor))
    }

    handleUpdate()

    editor.on("selectionUpdate", handleUpdate)
    editor.on("transaction", handleUpdate)

    return () => {
      editor.off("selectionUpdate", handleUpdate)
      editor.off("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, levels])

  return {
    isVisible,
    activeLevel,
    isActive,
    canToggle: canToggleState,
    levels,
    label: "Heading",
    Icon: activeLevel ? headingIcons[activeLevel] : HeadingIcon,
  }
}
