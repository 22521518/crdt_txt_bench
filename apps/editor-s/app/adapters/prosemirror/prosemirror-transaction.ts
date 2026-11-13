import type { Content, LinkMarkAttributes, RichTextTransaction, TextAlign } from "@/adapters/richtext-transaction";

export class ProseMirrorTransaction implements RichTextTransaction {
  focus(): this {
    throw new Error("Method not implemented.");
  }
  insertContent(text: Content): this {
    throw new Error("Method not implemented.");
  }
  setMark(name: string, attributes?: Record<string, any>): this {
    throw new Error("Method not implemented.");
  }
  unsetMark(name: string, options?: { extendEmptyMarkRange?: boolean; }): this {
    throw new Error("Method not implemented.");
  }
  isMarkTogglable(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean; }): boolean {
    throw new Error("Method not implemented.");
  }
  toggleMark(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean; }): this {
    throw new Error("Method not implemented.");
  }
  updateAttribute(typeOrName: string | any, attributes: Record<string, any>): this {
    throw new Error("Method not implemented.");
  }
  setLink(attributes: LinkMarkAttributes): this {
    throw new Error("Method not implemented.");
  }
  toggleLink(attributes?: LinkMarkAttributes): this {
    throw new Error("Method not implemented.");
  }
  unsetLink(): this {
    throw new Error("Method not implemented.");
  }
  extendMarkRange(name: string): this {
    throw new Error("Method not implemented.");
  }
  setNode(name: string, attributes?: Record<string, any>): this {
    throw new Error("Method not implemented.");
  }
  setMeta(key: string, value: any): this {
    throw new Error("Method not implemented.");
  }
  clearNodes(): this {
    throw new Error("Method not implemented.");
  }
  isNodeTogglable(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>): boolean {
    throw new Error("Method not implemented.");
  }
  toggleNode(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>): this {
    throw new Error("Method not implemented.");
  }
  selectTextblockEnd(): this {
    throw new Error("Method not implemented.");
  }
  setTextSelection(from: number, to: number): this {
    throw new Error("Method not implemented.");
  }
  setNodeSelection(node: any): this {
    throw new Error("Method not implemented.");
  }
  liftListItem?: ((typeOrName: string | any) => this) | undefined;
  lift?: ((typeOrName: string | any) => this) | undefined;
  isWrapTogglable(typeOrName: string | any, attributes?: Record<string, any>): boolean {
    throw new Error("Method not implemented.");
  }
  isListTogglable(listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>): boolean {
    throw new Error("Method not implemented.");
  }
  isTaskListTogglable(): boolean {
    throw new Error("Method not implemented.");
  }
  isBulletListTogglable(): boolean {
    throw new Error("Method not implemented.");
  }
  isOrderedListTogglable(): boolean {
    throw new Error("Method not implemented.");
  }
  wrapIn?: ((typeOrName: string | any, attributes?: Record<string, any>) => this) | undefined;
  toggleList?: ((listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>) => this) | undefined;
  toggleTaskList?: (() => this) | undefined;
  toggleBulletList?: (() => this) | undefined;
  toggleOrderedList?: (() => this) | undefined;
  isTextAlignUsable(align: TextAlign): boolean {
    throw new Error("Method not implemented.");
  }
  setTextAlign?: ((align: TextAlign) => this) | undefined;
  commit(): boolean {
    throw new Error("Method not implemented.");
  }

}