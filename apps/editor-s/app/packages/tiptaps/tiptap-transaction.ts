import type { LinkMarkAttributes, RichTextTransaction } from "@/libs/richtext-transaction";
import { NodeSelection } from "@tiptap/pm/state";
import { Editor, type ChainedCommands, type Content } from "@tiptap/react"

export class TiptapTransaction implements RichTextTransaction {
  private chain: ChainedCommands;
  constructor(private editor: Editor) { this.chain = editor.chain(); }

  focus() { this.chain = this.chain.focus(); return this; }
  // insertText(text: string, position?: number) { ; return this; }
  insertContent(content: Content) { this.chain = this.chain.insertContent(content); return this; }

  // setMark(name: string, attributes?: Record<string, any>) { this.chain = this.chain.setMark(name, attributes); return this; }
  /**
  * @param typeOrName The mark type or name.
  * @param options.extendEmptyMarkRange Removes the mark even across the current selection. Defaults to `false`.
  */
  unsetMark(name: string, options?: { extendEmptyMarkRange?: boolean }) { this.chain = this.chain.unsetMark(name, options); return this; }
  toggleMark(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }) { this.chain = this.chain.toggleMark(name, attributes, options); return this }

  setLink(attributes: LinkMarkAttributes) {
    this.chain = this.chain.setLink({ href: attributes.href, target: attributes.target, rel: attributes.rel, class: attributes.class })
    return this
  }
  toggleLink(attributes?: LinkMarkAttributes) {
    this.chain = this.chain.toggleLink({ href: attributes?.href ?? "", target: attributes?.target, rel: attributes?.rel, class: attributes?.class })
    return this
  }
  unsetLink() { this.chain = this.chain.unsetLink(); return this }

  extendMarkRange(name: string) { this.chain = this.chain.extendMarkRange(name); return this; }
  setNode(name: string, attributes?: Record<string, any>) { this.chain = this.chain.setNode(name, attributes); return this; }
  setMeta(key: string, value: any) { this.chain = this.chain.setMeta(key, value); return this; }
  clearNodes(): this { this.chain = this.chain.clearNodes(); return this }

  selectTextblockEnd() { this.chain = this.chain.selectTextblockEnd(); return this }
  setTextSelection(from: number, to: number) { this.chain = this.chain.setTextSelection({ from, to }); return this }
  setNodeSelection(node: any) { this.chain = this.chain.setNodeSelection(node); return this; }

  commit() { return this.chain.run() }
}