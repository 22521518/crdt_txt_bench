import React from 'react'
// --- Styles ---
import "./richtext-editor.scss"
import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { RichTextProvider } from '@/contexts/richtext-context'
import { useCursorVisibility, type EditorCursorCoord } from '@/hooks/tiptap/use-cursor-visibility'
import { Toolbar, MainToolbarContent, MobileToolbarContent } from '@/components/richtext/toolbar'
import { useCreateTipTapEditor } from '@/packages/tiptaps/tiptap-editor-factory'
import { EditorContent } from './richtext-editor-content'

export function RichTextEditor() {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<"main" | "highlighter" | "link">("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  // const [editor, setEditor] = React.useState(CreateTipTapEditor()) 
  const editor= useCreateTipTapEditor()


  const rect = useCursorVisibility({
    cursorCoord: editor.getCursorCoord(),
    isFocus: editor.isFocus(),
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main")
      setMobileView("main")
  }, [isMobile, mobileView])
  
  return (
    <div className="richtxt-editor-wrapper">
      <RichTextProvider editor={editor}>
        <Toolbar
          ref={toolbarRef}
          style={{ ...(isMobile ? { bottom: `calc(100% - ${height - rect.y}px)`} : {}) }}
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
