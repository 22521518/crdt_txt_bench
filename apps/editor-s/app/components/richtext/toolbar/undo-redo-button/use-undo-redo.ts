import * as React from "react"
import { Redo2Icon } from "@/components/tiptap-icons/redo2-icon"
import { Undo2Icon } from "@/components/tiptap-icons/undo2-icon"
import { checkEditorMarkNodeActive, type RichTextWrapper } from "@/libs/richtext"
import { useCurrentEditor } from "@/contexts/richtext-context"

export type UndoRedoAction = "undo" | "redo"

export const UNDO_REDO_SHORTCUT_KEYS: Record<UndoRedoAction, string> = {
  undo: "mod+z",
  redo: "mod+shift+z",
}

export interface UseUndoRedoConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: RichTextWrapper | null
  /**
   * The undo/redo action to perform.
   */
  action: UndoRedoAction
  /**
   * Whether the button should be hidden when the action cannot be executed.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Optional callback function that is called after the action is executed.
   */
  onExecuted?: () => void
}

export const historyActionLabels: Record<UndoRedoAction, string> = {
  undo: "Undo",
  redo: "Redo",
}

export const historyIcons: Record<
  UndoRedoAction,
  React.ComponentType<{ className?: string }>
> = {
  undo: Undo2Icon,
  redo: Redo2Icon,
}

/**
 * Checks if an undo/redo action can be executed on the editor
 */
export function canExecuteUndoRedoAction(
  editor: RichTextWrapper | null,
  action: UndoRedoAction
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (editor.isNodeTypeSelected && editor.isNodeTypeSelected(["image"])) return false
  if (action === "undo" && editor.undoable) return editor.undoable()
  if (action === "redo" && editor.redoable) return editor.redoable()
  return false
}

/**
 * Executes a history action on the editor
 */
export function executeUndoRedoAction(
  editor: RichTextWrapper | null,
  action: UndoRedoAction
): boolean {
  if (!editor || !editor.isEditable()) return false
  if (!canExecuteUndoRedoAction(editor, action)) return false
  if (action === "undo" && editor.undo) return editor.undo()
  if (action === "redo" && editor.redo) return editor.redo()

  return false
}

/**
 * Determines if the undo/redo button should be visible
 */
export function shouldShowButton(props: {
  editor: RichTextWrapper | null
  hideWhenUnavailable: boolean
  action: UndoRedoAction
}): boolean {
  const { editor, hideWhenUnavailable, action } = props

  if (!editor || !editor.isEditable()) return false

  const isCodeActive = checkEditorMarkNodeActive(editor, "code")
  if (hideWhenUnavailable && !isCodeActive) {
    return canExecuteUndoRedoAction(editor, action)
  }

  return true
}

/**
 * Custom hook that provides history functionality for Tiptap editor
 *
 * @param config - Configuration options for the hook
 * @returns Object containing state and handlers for undo/redo actions
 * @example
 * ```tsx
 * // Simple usage
 * function MySimpleUndoButton() {
 *   const { isVisible, handleAction } = useHistory({ action: "undo" })
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleAction}>Undo</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedRedoButton() {
 *   const { isVisible, handleAction, label } = useHistory({
 *     editor: myEditor,
 *     action: "redo",
 *     hideWhenUnavailable: true,
 *     onExecuted: () => console.log('Action executed!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleAction}
 *       aria-label={label}
 *     >
 *       Redo
 *     </MyButton>
 *   )
 * }
 * ```
*/
export function useUndoRedo({
  editor: providedEditor,
  action,
  hideWhenUnavailable = false,
  onExecuted,
}: UseUndoRedoConfig) {
  let editor = providedEditor ?? useCurrentEditor()

  const [isVisible, setIsVisible] = React.useState<boolean>(() =>
    shouldShowButton({ editor, hideWhenUnavailable, action })
  )
  const [canExecute, setCanExecute] = React.useState<boolean>(() =>
    canExecuteUndoRedoAction(editor, action)
  )

  React.useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable, action }))
      setCanExecute(canExecuteUndoRedoAction(editor, action))
    }

    handleUpdate()

    editor.on("transaction", handleUpdate)

    return () => {
      editor.off("transaction", handleUpdate)
    }
  }, [editor, hideWhenUnavailable, action])

  const handleAction = React.useCallback(() => {
    if (!editor) return false

    const success = executeUndoRedoAction(editor, action)
    if (success) {
      onExecuted?.()
    }
    return success
  }, [editor, action, onExecuted])

  return {
    isVisible,
    handleAction,
    canExecute,
    label: historyActionLabels[action],
    shortcutKeys: UNDO_REDO_SHORTCUT_KEYS[action],
    Icon: historyIcons[action],
  }
}
