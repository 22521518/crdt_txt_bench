import type { EditorCursorCoord } from "@/hooks/tiptap/use-cursor-visibility"
import type { RichTextTransaction } from "./richtext-transaction"
import type { RichTextEditorFactory } from "./editor-factory"

export interface RichTextNodeWrapper {
  getChildren: () => RichTextNodeWrapper[]
  getLength: () => number
}

export interface RichTextWrapper {
  /** The underlying editor engine instance (e.g., Tiptap Editor, Slate instance, etc.) */
  editor?: any
  createTransaction(): RichTextTransaction
  isExtensionAvailable(extensionNames: string | string[]): boolean

  isEditable: () => boolean
  isFocus: () => boolean

  isNodeTypeSelected: (types: string[]) => boolean
  isSelectedNodeTypeActive?: (name: string | null, attributes?: {}) => boolean
  isMarkActive?: (name: string | null, attributes?: {}) => boolean
  isNodeTypeInSchema: (typeName: string) => boolean
  isMarkInSchema: (markName: string) => boolean

  findNodePosition: (node: any) => number | null

  getSelectionMarkTypeList: () => readonly any[]
  getMarkTypeInSchema: (markName: string) => any | undefined
  getSelectionAttributes: (typeOrName: string | any) => any
  getSelectionType: () => 'inline' | 'block' | 'unknown'
  getSelectionNodes: () => RichTextNodeWrapper

  isSelectionMarkable: (markName: string | any, attributes?: {}) => boolean
  isNodeSetable: (markName: string | any, attributes?: {}) => boolean
  toggleSelectionWithMark: (markName: string | any, attributes?: {}) => boolean

  getSelection: () => { from: number, to: number, isEmpty: boolean, $anchor?: any }
  getCursorCoord: () => EditorCursorCoord

  createNode(pos: number, atNode?: any): any

  undoable?: () => boolean
  redoable?: () => boolean
  undo?: () => boolean
  redo?: () => boolean

  // Content transfer API
  getHTML: () => any
  setContentFromHTML: (htmlContent: string) => void
  getInternalContent: () => any
  setInternalContent: (content: any) => void

  // Event subscription API
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback: (...args: any[]) => void) => void

  // DOM lifecycle API
  doBeforeMount?: () => void
  mount: (element: HTMLElement) => void
  doAfterMount?: () => void

  doBeforeUnmount?: () => void
  unmount: () => void
  doAfterUnmount?: () => void

  destroy: () => void
  isDestroyed: () => boolean
}

export const isValidPosition = (
  pos: number | null | undefined
): pos is number => {
  return typeof pos === "number" &&
    Number.isFinite(pos) &&
    pos >= 0
}

export const checkEditorMarkNodeActive = (editor: RichTextWrapper, name: string | null, attributes?: {}) => {
  const checkActive = editor.isMarkActive ?? editor.isSelectedNodeTypeActive
  if (!checkActive) return false
  return checkActive(name, attributes)
}

export interface SwitchEditorOptions {
  /**
   * Whether to transfer HTML content from the current editor to the new editor.
   * @default true
   */
  transferContent?: boolean
  /**
   * Whether to destroy the previous editor instance after switching.
   * @default false
   */
  destroyOld?: boolean
}

/**
 * Singleton of the active RichTextWrapper instance.
 * Decoupled from specific vendor implementations via RichTextEditorFactory.
 * Enables switching between editors (Tiptap, Quill, Slate, etc.) with content preservation.
 */
export class RichTextSingleton {
  private static instance: RichTextWrapper | null = null
  private static defaultFactory: RichTextEditorFactory | null = null
  private static listeners = new Set<(instance: RichTextWrapper | null) => void>()

  /**
   * Register a default factory to instantiate the editor when getInstance is called and no instance exists.
   */
  public static registerDefaultFactory(factory: RichTextEditorFactory): void {
    this.defaultFactory = factory
  }

  /**
   * Get the registered default factory.
   */
  public static getDefaultFactory(): RichTextEditorFactory | null {
    return this.defaultFactory
  }

  /**
   * Retrieve the active RichTextWrapper instance.
   * Lazily creates an instance using the registered default factory if none exists.
   */
  public static getInstance(): RichTextWrapper | null {
    if (this.instance && !this.instance.isDestroyed?.()) {
      return this.instance
    }

    if (this.defaultFactory) {
      this.instance = this.defaultFactory.createEditor()
      this.notify()
      return this.instance
    }

    return null
  }

  /**
   * Snapshot selector compatible with React 18+ useSyncExternalStore.
   */
  public static getSnapshot = (): RichTextWrapper | null => {
    return this.getInstance()
  }

  /**
   * Set the active editor instance directly.
   */
  public static setInstance(editor: RichTextWrapper | null): void {
    if (this.instance === editor) return
    this.instance = editor
    this.notify()
  }

  /**
   * Subscribe to changes in the active instance.
   */
  public static subscribe(listener: (instance: RichTextWrapper | null) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private static notify(): void {
    const current = this.instance
    this.listeners.forEach((listener) => {
      try {
        listener(current)
      } catch (e) {
        console.error("Error in RichTextSingleton listener:", e)
      }
    })
  }

  /**
   * Switch the active instance to another RichTextWrapper.
   * Optionally transfers content and/or destroys the previous editor.
   */
  public static switchEditor(
    newEditor: RichTextWrapper,
    options?: SwitchEditorOptions
  ): void {
    const oldEditor = this.instance
    if (oldEditor === newEditor) return

    const shouldTransfer = options?.transferContent !== false

    if (shouldTransfer && oldEditor) {
      try {
        const htmlContent = oldEditor.getHTML?.()
        if (htmlContent && newEditor.setContentFromHTML) {
          newEditor.setContentFromHTML(htmlContent)
        }
      } catch (err) {
        console.warn("Could not transfer content during editor switch:", err)
      }
    }

    if (options?.destroyOld && oldEditor) {
      try {
        oldEditor.destroy?.()
      } catch (err) {
        console.warn("Could not destroy previous editor instance:", err)
      }
    }

    this.setInstance(newEditor)
  }

  /**
   * Destroy the current editor instance and reset the singleton.
   */
  public static destroy(): void {
    if (this.instance) {
      try {
        this.instance.destroy?.()
      } catch (err) {
        console.warn("Error destroying RichTextSingleton instance:", err)
      }
      this.setInstance(null)
    }
  }
}