import * as React from "react"
// import type { Editor } from "@tiptap/react"
import { useWindowSize } from "@/hooks/tiptap/use-window-size"
import { useBodyRect } from "@/hooks/tiptap/use-element-rect"

export interface EditorCursorCoord {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface CursorVisibilityOptions {
  /**
   * The Tiptap editor instance
   */
  cursorCoord?: EditorCursorCoord | null
  /**
   * Reference to the toolbar element that may obscure the cursor
   */
  overlayHeight?: number
  /**
   * Is editor focused?
   */
  isFocus: boolean
}

/**
 * Custom hook that ensures the cursor remains visible when typing in a Tiptap editor.
 * Automatically scrolls the window when the cursor would be hidden by the toolbar.
 *
 * @param options.editor The Tiptap editor instance
 * @param options.overlayHeight Toolbar height to account for
 * @returns The bounding rect of the body
 */
export function useCursorVisibility({
  cursorCoord,
  isFocus,
  overlayHeight = 0,
}: CursorVisibilityOptions) {
  const { height: windowHeight } = useWindowSize()
  const rect = useBodyRect({
    enabled: true,
    throttleMs: 100,
    useResizeObserver: true,
  })

  React.useEffect(() => {
    const ensureCursorVisibility = () => {
      if (!cursorCoord) return
      if (!isFocus) return

      // Get current cursor position coordinates

      if (windowHeight < rect.height && cursorCoord) {
        const availableSpace = windowHeight - cursorCoord.top

        // If the cursor is hidden behind the overlay or offscreen, scroll it into view
        if (availableSpace < overlayHeight) {
          const targetCursorY = Math.max(windowHeight / 2, overlayHeight)
          const currentScrollY = window.scrollY
          const cursorAbsoluteY = cursorCoord.top + currentScrollY
          const newScrollY = cursorAbsoluteY - targetCursorY

          window.scrollTo({
            top: Math.max(0, newScrollY),
            behavior: "smooth",
          })
        }
      }
    }

    ensureCursorVisibility()
  }, [cursorCoord, overlayHeight, windowHeight, rect.height])

  return rect
}
