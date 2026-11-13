import React from 'react'
// --- Styles ---
import "./richtext-editor.scss"
import "@/components/tiptap-nodes/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-nodes/code-block-node/code-block-node.scss"
import "@/components/tiptap-nodes/list-node/list-node.scss"
import "@/components/tiptap-nodes/heading-node/heading-node.scss"
import "@/components/tiptap-nodes/paragraph-node/paragraph-node.scss"

import { useIsMobile } from '@/hooks/tiptap/use-mobile'
import { useWindowSize } from '@/hooks/tiptap/use-window-size'
import { RichTextProvider } from '@/contexts/richtext-context'
import { useCursorVisibility } from '@/hooks/tiptap/use-cursor-visibility'
import { Toolbar, MainToolbarContent, MobileToolbarContent } from '@/components/richtext/toolbar'
import { EditorContent } from './richtext-editor-content' 
import { type SupportedEngineType } from '@/adapters/richtext-adapter'
import { useRichTextContext } from '@/hooks/richtext-singleton'
import { createTiptapEditorAdapter } from '@/adapters/tiptaps/tiptap-editor-factory'

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
  const { editor, switchEditor } = useRichTextContext()

  const [engine, setEngine] = React.useState<SupportedEngineType>('tiptap')
  const [internalEditor, setInternalEditor] = React.useState(editor?.editor ?? null)

  const rect = useCursorVisibility({
    cursorCoord: editor ? editor.getCursorCoord() : null,
    isFocus: editor ? editor.isFocus() : false,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    switch(engine) {
      case 'tiptap': 
    }
  }, [engine])

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])
  
  return (
    <div className="richtxt-editor-wrapper">
      <button
        type="button"
        onClick={() => switchEditor(createTiptapEditorAdapter().adapter, { transferContent: false, destroyOld: true })
        }
      >
        Change  
      </button> 

      <RichTextProvider editor={editor}>
        <Toolbar
          ref={toolbarRef}
          style={{ ...(isMobile ? { bottom: `calc(100% - ${height - rect.y}px)` } : {}) }}
        >
          {mobileView === "main" ? 
          (<MainToolbarContent onHighlighterClick={() => setMobileView("highlighter")} onLinkClick={() => setMobileView("link")} isMobile={isMobile} />) 
          : 
          (<MobileToolbarContent type={mobileView === "highlighter" ? "highlighter" : "link"} onBack={() => setMobileView("main")} />)}
        </Toolbar>

        <EditorContent/>
      </RichTextProvider>
    </div>
  )
}
