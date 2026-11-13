import type { LinkMarkAttributes, RichTextTransaction, TextAlign } from "@/adapters/richtext-transaction";
import { Editor, type ChainedCommands, type Content } from "@tiptap/react"

export class TiptapTransaction implements RichTextTransaction {
  private chain: ChainedCommands;
  constructor(private editor: Editor) { this.chain = editor.chain(); }

  focus() { this.chain = this.chain.focus(); return this; }
  // insertText(text: string, position?: number) { ; return this; }
  insertContent(content: Content) { this.chain = this.chain.insertContent(content); return this; }

  /**
   * @param typeOrName The mark type or name.
   * @param options.extendEmptyMarkRange Removes the mark even across the current selection. Defaults to `false`.
  */
  setMark(name: string, attributes?: Record<string, any>) { this.chain = this.chain.setMark(name, attributes); return this; }
  unsetMark(name: string, options?: { extendEmptyMarkRange?: boolean }) { this.chain = this.chain.unsetMark(name, options); return this; }
  isMarkTogglable(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }) { return this.editor.can().toggleMark(name, attributes, options); }
  toggleMark(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }) { this.chain = this.chain.toggleMark(name, attributes, options); return this }
  updateAttribute(typeOrName: string | any, attributes: Record<string, any>) { this.chain = this.chain.updateAttributes(typeOrName, attributes); return this }

  setLink(attributes: LinkMarkAttributes) { this.chain = this.chain.setLink(convertToNativeLinkAttribute(attributes)); return this }
  toggleLink(attributes?: LinkMarkAttributes) { this.chain = this.chain.toggleLink(convertToNativeLinkAttribute(attributes)); return this }
  unsetLink() { this.chain = this.chain.unsetLink(); return this }

  extendMarkRange(name: string) { this.chain = this.chain.extendMarkRange(name); return this; }
  setNode(name: string, attributes?: Record<string, any>) { this.chain = this.chain.setNode(name, attributes); return this; }
  setMeta(key: string, value: any) { this.chain = this.chain.setMeta(key, value); return this; }
  clearNodes(): this { this.chain = this.chain.clearNodes(); return this }
  isNodeTogglable(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>) { return this.editor.can().toggleNode(typeOrName, toggleTypeOrName, attributes); }
  toggleNode(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>) { this.chain = this.chain.toggleNode(typeOrName, toggleTypeOrName, attributes); return this }

  selectTextblockEnd() { this.chain = this.chain.selectTextblockEnd(); return this }
  setTextSelection(from: number, to: number) { this.chain = this.chain.setTextSelection({ from, to }); return this }
  setNodeSelection(node: any) { this.chain = this.chain.setNodeSelection(node); return this; }

  // schema-list extensions
  liftListItem(typeOrName: string | any) { this.chain = this.chain.liftListItem(typeOrName); return this }
  lift(typeOrName: string | any) { this.chain = this.chain.lift(typeOrName); return this }
  isWrapTogglable(typeOrName: string | any, attributes?: Record<string, any>): boolean { return this.wrapIn !== undefined && this.editor.can().toggleWrap(typeOrName, attributes) }
  isTaskListTogglable() { return this.toggleTaskList !== undefined && this.editor.can().toggleTaskList() }
  isBulletListTogglable() { return this.toggleBulletList !== undefined && this.editor.can().toggleBulletList() }
  isOrderedListTogglable() { return this.toggleOrderedList !== undefined && this.editor.can().toggleOrderedList() }
  isListTogglable(listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>) { return this.toggleList !== undefined && this.editor.can().toggleList(listTypeOrName, itemTypeOrName, keepMarks, attributes) }
  wrapIn(typeOrName: string | any, attributes?: Record<string, any>) { this.chain = this.chain.wrapIn(typeOrName, attributes); return this }
  toggleList(listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>) { this.chain = this.chain.toggleList(listTypeOrName, itemTypeOrName, keepMarks, attributes); return this }
  toggleTaskList() { this.chain = this.chain.toggleTaskList(); return this }
  toggleBulletList() { this.chain = this.chain.toggleBulletList(); return this }
  toggleOrderedList() { this.chain = this.chain.toggleOrderedList(); return this }

  isTextAlignUsable(align: TextAlign) { return this.setTextAlign !== undefined && this.editor.can().setTextAlign(align) }
  setTextAlign(align: TextAlign) { this.chain = this.chain.setTextAlign ? this.chain.setTextAlign(align) : this.chain; return this }


  commit() { return this.chain.run() }
}

function convertToNativeLinkAttribute(attributes?: LinkMarkAttributes): {
  href: string;
  target?: string | null | undefined;
  rel?: string | null | undefined;
  class?: string | null | undefined;
  title?: string | null | undefined;
} {
  return { href: attributes?.href ?? "", target: attributes?.target, rel: attributes?.rel, class: attributes?.class }
}