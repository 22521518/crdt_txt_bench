import React from "react"
import { Spacer } from "../../spacer"
import { ToolbarGroup, ToolbarSeparator } from "./toolbar"
import { ThemeToggle } from "../../theme-toggle"
import { UndoRedoButton } from "./undo-redo-button"
import { Button } from "@/components/button"
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { ColorHighlightPopover, ColorHighlightPopoverButton, ColorHighlightPopoverContent } from "@/components/color-highlight-popover"
import { LinkButton, LinkContent, LinkPopover } from "@/components/link-popover"

export const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton /> */}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" /> */}
        <ColorHighlightPopoverButton onClick={isMobile ? () => onHighlighterClick() : ()=>{}} />
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* <MarkButton type="superscript" />
        <MarkButton type="subscript" /> */}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" /> */}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        {/* <ImageUploadButton text="Add" /> */}
      </ToolbarGroup>

      
      <Spacer /> 

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

export const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)