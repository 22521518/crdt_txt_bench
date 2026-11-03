"use client"

import * as React from "react"
import { useHotkeys } from "react-hotkeys-hook"

// --- Hooks ---
import { useIsMobile } from "@/hooks/tiptap/use-mobile"

// --- Context ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import type { RichTextWrapper } from "@/libs/richtext"
import { HIGHLIGHT_COLORS } from "./constant"

export const COLOR_HIGHLIGHT_SHORTCUT_KEY = "mod+shift+h"

/**
 * Configuration for the color highlight functionality
 */
export interface UseColorHighlightConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * The color to apply when toggling the highlight.
   */
  highlightColor?: string
  /**
   * Optional label to display alongside the icon.
   */
  label?: string
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Called when the highlight is applied.
   */
  onApplied?: ({ color, label }: { color: string; label: string }) => void
}

export function pickHighlightColorsByValue(values: string[]) {
  const colorMap = new Map(
    HIGHLIGHT_COLORS.map((color) => [color.value, color])
  )
  return values
    .map((value) => colorMap.get(value))
    .filter((color): color is (typeof HIGHLIGHT_COLORS)[number] => !!color)
}

export function canColorHighlight(editor: RichTextWrapper | null): boolean {
  if (!editor) return false
  const isEditable = typeof editor.isEditable === "function" ? editor.isEditable() : Boolean(editor.isEditable)
  if (!isEditable) return false
  if (editor.isNodeTypeSelected?.(["image"])) return false
  return editor.isSelectionMarkable?.("highlight") ?? false
}

export function isColorHighlightActive(
  editor: RichTextWrapper | null,
  highlightColor?: string
): boolean {
  if (!editor) return false
  const isEditable = typeof editor.isEditable === "function" ? editor.isEditable() : Boolean(editor.isEditable)
  if (!isEditable) return false
  const checkActive = editor.isMarkActive ?? editor.isSelectedNodeTypeActive
  if (!checkActive) return false
  return highlightColor ?
    checkActive("highlight", { color: highlightColor }) :
    checkActive("highlight")
}

export function removeHighlight(editor: RichTextWrapper | null): boolean {
  if (!editor) return false
  const isEditable = typeof editor.isEditable === "function" ? editor.isEditable() : Boolean(editor.isEditable)
  if (!isEditable) return false
  if (!canColorHighlight(editor)) return false
  return editor.createTransaction().focus().unsetMark("highlight").commit()
}

export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor) return false
  const isEditable = typeof editor.isEditable === "function" ? editor.isEditable() : Boolean(editor.isEditable)
  if (!isEditable) return false
  if (!editor.isMarkInSchema?.("highlight")) return false

  const checkActive = editor.isMarkActive ?? editor.isSelectedNodeTypeActive
  if (hideWhenUnavailable && checkActive && !checkActive("code")) {
    return canColorHighlight(editor)
  }

  return true
}

export function useColorHighlight(config: UseColorHighlightConfig) {
  const {
    editor: providedEditor,
    label,
    highlightColor,
    hideWhenUnavailable = false,
    onApplied,
  } = config

  const currentEditor = useCurrentEditor()
  const editor = providedEditor ?? currentEditor
  const isMobile = useIsMobile()

  const [isVisible, setIsVisible] = React.useState<boolean>(() =>
    shouldShowButton({ editor, hideWhenUnavailable })
  )
  const [canColorHighlightState, setCanColorHighlightState] = React.useState<boolean>(() =>
    canColorHighlight(editor)
  )
  const [isActive, setIsActive] = React.useState<boolean>(() =>
    isColorHighlightActive(editor, highlightColor)
  )

  React.useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
      setCanColorHighlightState(canColorHighlight(editor))
      setIsActive(isColorHighlightActive(editor, highlightColor))
    }

    handleUpdate()

    editor.on?.("selectionUpdate", handleUpdate)
    editor.on?.("transaction", handleUpdate)

    return () => {
      editor.off?.("selectionUpdate", handleUpdate)
      editor.off?.("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, highlightColor])

  const handleColorHighlight = React.useCallback(() => {
    if (!editor || !canColorHighlightState || !highlightColor || !label) return false

    const success = editor
      .createTransaction()
      .focus()
      .toggleMark("highlight", { color: highlightColor })
      .commit()

    if (success) {
      onApplied?.({ color: highlightColor, label })
    }
    return success
  }, [canColorHighlightState, highlightColor, editor, label, onApplied])

  const handleRemoveHighlight = React.useCallback(() => {
    const success = removeHighlight(editor)
    if (success) {
      onApplied?.({ color: "", label: "Remove highlight" })
    }
    return success
  }, [editor, onApplied])

  useHotkeys(
    COLOR_HIGHLIGHT_SHORTCUT_KEY,
    (event) => {
      event.preventDefault()
      handleColorHighlight()
    },
    {
      enabled: isVisible && canColorHighlightState,
      enableOnContentEditable: !isMobile,
      enableOnFormTags: true,
    }
  )

  return {
    isVisible,
    isActive,
    handleColorHighlight,
    handleRemoveHighlight,
    canColorHighlight: canColorHighlightState,
    label: label || `Highlight`,
    shortcutKeys: COLOR_HIGHLIGHT_SHORTCUT_KEY,
    Icon: HighlighterIcon,
  }
}
