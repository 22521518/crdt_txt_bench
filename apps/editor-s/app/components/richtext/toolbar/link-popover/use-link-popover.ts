import * as React from "react"

// --- Icons ---
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Lib ---
import { sanitizeUrl } from "@/libs/components.utils"
import { checkEditorMarkNodeActive, type RichTextWrapper } from "@/libs/richtext"

// --- Context --- 
import { useCurrentEditor } from "@/contexts/richtext-context"

/**
 * Configuration for the link popover functionality
 */
export interface UseLinkPopoverConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * Whether to hide the link popover when not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called when the link is set.
   */
  onSetLink?: () => void
}

/**
 * Configuration for the link handler functionality
 */
export interface LinkHandlerProps {
  /**
   * The Tiptap editor instance.
   */
  editor: RichTextWrapper | null
  /**
   * Callback function RichTextWrapper when the link is set.
   */
  onSetLink?: () => void
}

/**
 * Checks if a link can be set in the current editor state
 */
export function canSetLink(editor: RichTextWrapper | null): boolean {
  if (!editor || !editor.isEditable()) return false
  return editor.isSelectionMarkable("link")
}

/**
 * Checks if a link is currently active in the editor
 */
export function isLinkActive(editor: RichTextWrapper | null): boolean {
  if (!editor || !editor.isEditable()) return false
  // return editor.isSelectedNodeTypeActive?.("link") ?? false
  return checkEditorMarkNodeActive(editor, "link")
}

/**
 * Determines if the link button should be shown
 */
export function shouldShowLinkButton(props: {
  editor: RichTextWrapper | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  const linkInSchema = editor?.isMarkInSchema("link")

  if (!linkInSchema || !editor) {
    return false
  }
  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canSetLink(editor)
  }

  return true
}

/**
 * Custom hook for handling link operations in a Tiptap editor
 */
export function useLinkHandler(props: LinkHandlerProps) {
  const { editor, onSetLink } = props
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!editor) return

    // Get URL immediately on mount
    const { href } = editor.getSelectionAttributes("link")

    if (isLinkActive(editor) && url === null) {
      setUrl(href || "")
    }
  }, [editor, url])

  React.useEffect(() => {
    if (!editor) return

    const updateLinkState = () => {
      const { href } = editor.getSelectionAttributes("link")
      setUrl(href || "")
    }

    editor.on && editor.on("selectionUpdate", updateLinkState)
    return () => {
      editor.off && editor.off("selectionUpdate", updateLinkState)
    }
  }, [editor])

  const setLink = React.useCallback(() => {
    if (!url || !editor) return

    const { isEmpty } = editor.getSelection()

    let chain = editor.createTransaction().focus()

    chain = chain.extendMarkRange("link").setLink({ href: url })
    if (isEmpty) chain = chain.insertContent({ type: "text", text: url })
    chain.commit()

    setUrl(null)

    onSetLink?.()
  }, [editor, onSetLink, url])

  const removeLink = React.useCallback(() => {
    if (!editor) return
    editor
      .createTransaction()
      .focus()
      .extendMarkRange("link")
      .unsetMark("link", { extendEmptyMarkRange: true })
      .setMeta("preventAutolink", true)
      .commit()
    setUrl("")
  }, [editor])

  const openLink = React.useCallback(
    (target: string = "_blank", features: string = "noopener,noreferrer") => {
      if (!url) return

      const safeUrl = sanitizeUrl(url, window.location.href)
      if (safeUrl !== "#") {
        window.open(safeUrl, target, features)
      }
    },
    [url]
  )

  return {
    url: url || "",
    setUrl,
    setLink,
    removeLink,
    openLink,
  }
}

/**
 * Custom hook for link popover state management
 */
export function useLinkState(props: {
  editor: RichTextWrapper | null
  hideWhenUnavailable: boolean
}) {
  const { editor, hideWhenUnavailable = false } = props

  const canSet = canSetLink(editor)
  const isActive = isLinkActive(editor)

  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowLinkButton({
          editor,
          hideWhenUnavailable,
        })
      )
    }

    handleSelectionUpdate()
    editor.on && editor.on("selectionUpdate", handleSelectionUpdate)
    return () => {
      editor.off && editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  return {
    isVisible,
    canSet,
    isActive,
  }
}

/**
 * Main hook that provides link popover functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover()
 *
 *   if (!isVisible) return null
 *
 *   return <button disabled={!canSet}>Link</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onSetLink: () => console.log('Link set!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       disabled={!canSet}
 *       aria-label={label}
 *       aria-pressed={isActive}
 *     >
 *       <Icon />
 *       {label}
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useLinkPopover(config?: UseLinkPopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onSetLink,
  } = config || {}

  const contextEditor = useCurrentEditor()
    let editor = providedEditor ?? contextEditor

  const { isVisible, canSet, isActive } = useLinkState({
    editor,
    hideWhenUnavailable,
  })

  const linkHandler = useLinkHandler({
    editor,
    onSetLink,
  })

  return {
    isVisible,
    canSet,
    isActive,
    label: "Link",
    Icon: LinkIcon,
    ...linkHandler,
  }
}
