import React from 'react'
// --- Styles ---
import "./richtext-editor.scss"
import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { RichTextProvider, useCurrentEditor } from '@/contexts/richtext-context'
import { useCursorVisibility } from '@/hooks/tiptap/use-cursor-visibility'
import { Toolbar, MainToolbarContent, MobileToolbarContent } from '@/components/richtext/toolbar'
import { createTiptapEditor } from '@/adapters/tiptaps/tiptap-editor-factory'
import { EditorContent } from './richtext-editor-content' 
import "@/components/tiptap-nodes/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-nodes/code-block-node/code-block-node.scss"
import "@/components/tiptap-nodes/list-node/list-node.scss"
import "@/components/tiptap-nodes/heading-node/heading-node.scss"
import "@/components/tiptap-nodes/paragraph-node/paragraph-node.scss"
import { RichTextSingleton, type SupportedEngineType } from '@/libs/richtext'

interface RichEditorProps {
  engine: SupportedEngineType;
  initialContent: any;
  onChange?: (content: any) => void;
}

export function RichTextEditor() {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<"main" | "highlighter" | "link">("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const editor = useCurrentEditor()

  const rect = useCursorVisibility({
    cursorCoord: editor ? editor.getCursorCoord() : null,
    isFocus: editor ? editor.isFocus() : false,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])
  
  return (
    <div className="richtxt-editor-wrapper">
      <button
        type="button"
        onClick={() => {
          RichTextSingleton.switchEditor(
            createTiptapEditor(), { transferContent: false, destroyOld: true }
          )
        }}
      >
        Change
      </button>

      <RichTextProvider editor={editor}>
        <Toolbar
          ref={toolbarRef}
          style={{ ...(isMobile ? { bottom: `calc(100% - ${height - rect.y}px)` } : {}) }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="richtxt-editor-content"
        />
      </RichTextProvider>
    </div>
  )
}
