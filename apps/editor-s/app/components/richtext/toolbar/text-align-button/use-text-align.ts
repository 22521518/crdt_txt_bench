import * as React from "react"
import type { ChainedCommands } from "@tiptap/react"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Icons ---
import { AlignCenterIcon } from "@/components/tiptap-icons/align-center-icon"
import { AlignJustifyIcon } from "@/components/tiptap-icons/align-justify-icon"
import { AlignLeftIcon } from "@/components/tiptap-icons/align-left-icon"
import { AlignRightIcon } from "@/components/tiptap-icons/align-right-icon"
import { checkEditorMarkNodeActive, type RichTextAdapter } from "@/adapters/richtext-adapter"
import type { TextAlign } from "@/adapters/richtext-transaction"
export type { TextAlign }

/**
 * Configuration for the text align functionality
 */
export interface UseTextAlignConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextAdapter | null
  /**
   * The text alignment to apply.
   */
  align: TextAlign
  /**
   * Whether the button should hide when alignment is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful alignment change.
   */
  onAligned?: () => void
}

export const TEXT_ALIGN_SHORTCUT_KEYS: Record<TextAlign, string> = {
  left: "mod+shift+l",
  center: "mod+shift+e",
  right: "mod+shift+r",
  justify: "mod+shift+j",
}

export const textAlignIcons = {
  left: AlignLeftIcon,
  center: AlignCenterIcon,
  right: AlignRightIcon,
  justify: AlignJustifyIcon,
}

export const textAlignLabels: Record<TextAlign, string> = {
  left: "Align left",
  center: "Align center",
  right: "Align right",
  justify: "Align justify",
}

/**
 * Checks if text alignment can be performed in the current editor state
 */
export function canSetTextAlign(
  editor: RichTextAdapter | null,
  align: TextAlign
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (
    !editor.isExtensionAvailable("textAlign") ||
    editor.isNodeTypeSelected(["image", "horizontalRule"])
  )
    return false

  return editor.createTransaction().isTextAlignUsable(align)
}

/**
 * Checks if the text alignment is currently active
 */
export function isTextAlignActive(
  editor: RichTextAdapter | null,
  align: TextAlign
): boolean {
  if (!editor || !editor.isEditable()) return false
  return checkEditorMarkNodeActive(editor, null, { textAlign: align })
}

/**
 * Sets text alignment in the editor
 */
export function setTextAlign(editor: RichTextAdapter | null, align: TextAlign): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canSetTextAlign(editor, align)) return false

  const chain = editor.createTransaction().focus()
  return chain.setTextAlign?.(align).commit() ?? false
}

/**
 * Determines if the text align button should be shown
 */
export function shouldShowButton(props: {
  editor: RichTextAdapter | null
  hideWhenUnavailable: boolean
  align: TextAlign
}): boolean {
  const { editor, hideWhenUnavailable, align } = props

  if (!editor || !editor.isEditable()) return false
  if (!editor.isExtensionAvailable("textAlign")) return false

  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canSetTextAlign(editor, align)
  }

  return true
}

/**
 * Custom hook that provides text align functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleAlignButton() {
 *   const { isVisible, handleTextAlign } = useTextAlign({ align: "center" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleTextAlign}>Align Center</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedAlignButton() {
 *   const { isVisible, handleTextAlign, label, isActive } = useTextAlign({
 *     editor: myEditor,
 *     align: "right",
 *     hideWhenUnavailable: true,
 *     onAligned: () => console.log('Text aligned!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleTextAlign}
 *       aria-pressed={isActive}
 *       aria-label={label}
 *     >
 *       Align Right
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useTextAlign(config: UseTextAlignConfig) {
  const {
    editor: providedEditor,
    align,
    hideWhenUnavailable = false,
    onAligned,
  } = config

  const contextEditor = useCurrentEditor()
  const editor = providedEditor ?? contextEditor
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const [canAlign, setCanAlign] = React.useState(false)
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, align, hideWhenUnavailable }))
      setCanAlign(canSetTextAlign(editor, align))
      setIsActive(isTextAlignActive(editor, align))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)
    editor.on("transaction", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
      editor.off("transaction", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable, align])

  const handleTextAlign = React.useCallback(() => {
    if (!editor) return false

    const success = setTextAlign(editor, align)
    if (success) {
      onAligned?.()
    }
    return success
  }, [editor, align, onAligned])

  return {
    isVisible,
    isActive,
    handleTextAlign,
    canAlign,
    label: textAlignLabels[align],
    shortcutKeys: TEXT_ALIGN_SHORTCUT_KEYS[align],
    Icon: textAlignIcons[align],
  }
}
