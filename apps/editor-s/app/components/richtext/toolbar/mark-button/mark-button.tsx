"use client"

import * as React from "react"

// --- Lib ---
import { parseShortcutKeys } from "@/libs/key-shortcut.utils"

// --- Hooks ---
import { useCurrentEditor } from "@/contexts/richtext-context"

// --- Tiptap UI ---
import type { Mark, UseMarkConfig } from "./use-mark"
import { MARK_SHORTCUT_KEYS, useMark } from "./use-mark"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/button"
import { Button } from "@/components/button"
import { Badge } from "@/components/badge"

export interface MarkButtonProps
  extends Omit<ButtonProps, "type">,
    UseMarkConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean
}

export function MarkShortcutBadge({
  type,
  shortcutKeys = MARK_SHORTCUT_KEYS[type],
}: {
  type: Mark
  shortcutKeys?: string
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>
}

/**
 * Button component for toggling marks in a Tiptap editor.
 *
 * For custom button implementations, use the `useMark` hook instead.
 */
export const MarkButton = React.forwardRef<HTMLButtonElement, MarkButtonProps>(
  (
    {
      editor: providedEditor,
      type,
      text,
      hideWhenUnavailable = false,
      onToggled,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = providedEditor ?? useCurrentEditor()
    const {
      isVisible,
      handleMark,
      label,
      canToggle,
      isActive,
      Icon,
      shortcutKeys,
    } = useMark({
      editor,
      type,
      hideWhenUnavailable,
      onToggled,
    })

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleMark()
      },
      [handleMark, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        disabled={!canToggle}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={!canToggle}
        role="button"
        tabIndex={-1}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onMouseDown={(e) => {
          // Keep focus & selection on the editor
          e.preventDefault()
        }}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && (
              <MarkShortcutBadge type={type} shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    )
  }
)

MarkButton.displayName = "MarkButton"
