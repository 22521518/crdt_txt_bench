import * as React from "react"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { BoldIcon } from "@/components/tiptap-icons/bold-icon"
import { Code2Icon } from "@/components/tiptap-icons/code2-icon"
import { ItalicIcon } from "@/components/tiptap-icons/italic-icon"
import { StrikeIcon } from "@/components/tiptap-icons/strike-icon"
import { SubscriptIcon } from "@/components/tiptap-icons/subscript-icon"
import { SuperscriptIcon } from "@/components/tiptap-icons/superscript-icon"
import { UnderlineIcon } from "@/components/tiptap-icons/underline-icon"
import { checkEditorMarkNodeActive, type RichTextWrapper } from "@/libs/richtext"

export type Mark =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "underline"
  | "superscript"
  | "subscript"

/**
 * Configuration for the mark functionality
 */
export interface UseMarkConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * The type of mark to toggle
   */
  type: Mark
  /**
   * Whether the button should hide when mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful mark toggle.
   */
  onToggled?: () => void
}

export const markIcons = {
  bold: BoldIcon,
  italic: ItalicIcon,
  underline: UnderlineIcon,
  strike: StrikeIcon,
  code: Code2Icon,
  superscript: SuperscriptIcon,
  subscript: SubscriptIcon,
}

export const MARK_SHORTCUT_KEYS: Record<Mark, string> = {
  bold: "mod+b",
  italic: "mod+i",
  underline: "mod+u",
  strike: "mod+shift+s",
  code: "mod+e",
  superscript: "mod+.",
  subscript: "mod+,",
}

/**
 * Checks if a mark can be toggled in the current editor state
 */
export function canToggleMark(editor: RichTextWrapper | null, type: Mark): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!editor.isMarkInSchema(type) || editor.isNodeTypeSelected(["image"]))
    return false

  return editor.createTransaction().isMarkTogglable(type)
}

/**
 * Checks if a mark is currently active
 */
export function isMarkActive(editor: RichTextWrapper | null, type: Mark): boolean {
  if (!editor || !editor.isEditable()) return false
  return checkEditorMarkNodeActive(editor, type)
}

/**
 * Toggles a mark in the editor
 */
export function toggleMark(editor: RichTextWrapper | null, type: Mark): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canToggleMark(editor, type)) return false

  return editor.createTransaction().focus().toggleMark(type).commit()
}

/**
 * Determines if the mark button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  type: Mark
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, type, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isMarkInSchema(type)) return false

  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canToggleMark(editor, type)
  }

  return true
}

/**
 * Gets the formatted mark name
 */
export function getFormattedMarkName(type: Mark): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Custom hook that provides mark functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleBoldButton() {
 *   const { isVisible, handleMark } = useMark({ type: "bold" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleMark}>Bold</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedItalicButton() {
 *   const { isVisible, handleMark, label, isActive } = useMark({
 *     editor: myEditor,
 *     type: "italic",
 *     hideWhenUnavailable: true,
 *     onToggled: () => console.log('Mark toggled!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleMark}
 *       aria-pressed={isActive}
 *       aria-label={label}
 *     >
 *       Italic
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useMark(config: UseMarkConfig) {
  const {
    editor: providedEditor,
    type,
    hideWhenUnavailable = false,
    onToggled,
  } = config

  const contextEditor = useCurrentEditor()
    const editor = providedEditor ?? contextEditor
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const [canToggle, setCanToggle] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, type, hideWhenUnavailable }))
      setCanToggle(canToggleMark(editor, type))
      setIsActive(isMarkActive(editor, type))
      // setIs
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)
    editor.on("transaction", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
      editor.off("transaction", handleSelectionUpdate)
    }
  }, [editor, type, hideWhenUnavailable])

  const handleMark = React.useCallback(() => {
    if (!editor) return false

    const success = toggleMark(editor, type)
    if (success) {
      onToggled?.()
    }
    return success
  }, [editor, type, onToggled])

  return {
    isVisible,
    isActive,
    handleMark,
    canToggle,
    label: getFormattedMarkName(type),
    shortcutKeys: MARK_SHORTCUT_KEYS[type],
    Icon: markIcons[type],
  }
}
