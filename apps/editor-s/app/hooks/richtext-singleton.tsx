import React from "react";
import type { RichTextAdapter } from "@/adapters/richtext-adapter";
import { RichTextContext } from "../contexts/richtext-context";
import type { RichTextEditorFactory } from "@/adapters/richtext-factory";

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
 * Hook to reactively subscribe to changes in RichTextSingleton via useSyncExternalStore.
 */
export function useRichTextSingleton(): RichTextAdapter | null {
  return React.useSyncExternalStore(
    RichTextSingleton.subscribe.bind(RichTextSingleton),
    RichTextSingleton.getSnapshot,
    () => null // Server snapshot for SSR hydration safety
  )
}

type RichTextContextWithSingleton = [
    RichTextAdapter | null, 
    (editor: RichTextAdapter | null, options?: SwitchEditorOptions) => void
  ] & {
    editor: RichTextAdapter | null
    // setEditor: (editor: RichTextController | null) => void
    switchEditor: (newEditor: RichTextAdapter, options?: SwitchEditorOptions) => void
  }
/**
 * Hook returning the active editor along with setEditor and switchEditor controls.
 * Supports both tuple destructuring: `const [editor, setEditor] = useRichTextContext()`
 * and object destructuring: `const { editor, setEditor, switchEditor } = useRichTextContext()`.
 */
export function useRichTextContext() {
  const context = React.useContext(RichTextContext)
  const singletonEditor = useRichTextSingleton()

  const editor = context?.editor ?? singletonEditor
  // const setEditor = RichTextSingleton.setInstance.bind(RichTextSingleton)
  const switchEditor = RichTextSingleton.switchEditor.bind(RichTextSingleton)

  const result: any = [editor] //, setEditor]
  result.editor = editor
  // result.setEditor = setEditor
  result.switchEditor = switchEditor

  return result as RichTextContextWithSingleton
}


/**
 * Singleton of the active RichTextAdapter instance.
 * Decoupled from specific vendor implementations via RichTextEditorFactory.
 * Enables switching between editors (Tiptap, Quill, Slate, etc.) with content preservation.
 */
export class RichTextSingleton {
  private static instance: RichTextAdapter | null = null
  private static defaultFactory: RichTextEditorFactory | null = null
  private static listeners = new Set<(instance: RichTextAdapter | null) => void>()

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
   * Retrieve the active RichTextAdapter instance.
   * Lazily creates an instance using the registered default factory if none exists.
   */
  public static getInstance(): RichTextAdapter | null {
    if (this.instance && !this.instance.isDestroyed?.()) return this.instance
    if (this.defaultFactory) {
      this.instance = this.defaultFactory.createEditor().adapter
      this.notify()
      return this.instance
    }

    return null
  }

  /**
   * Snapshot selector compatible with React 18+ useSyncExternalStore.
   */
  public static getSnapshot = (): RichTextAdapter | null => {
    return this.getInstance()
  }

  /**
   * Set the active editor instance directly.
   */
  private static setInstance(editor: RichTextAdapter | null): void {
    if (this.instance === editor) return
    this.instance = editor
    this.notify()
  }

  /**
   * Subscribe to changes in the active instance.
   */
  public static subscribe(listener: (instance: RichTextAdapter | null) => void): () => void {
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
   * Switch the active instance to another RichTextAdapter.
   * Optionally transfers content and/or destroys the previous editor.
   */
  public static switchEditor(
    newEditor: RichTextAdapter,
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