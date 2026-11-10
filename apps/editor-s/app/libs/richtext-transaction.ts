import type { RichTextWrapper } from "./richtext";

export interface RichTextCommand {
  execute(context: RichTextCommandContext): boolean;
}

export interface RichTextCommandContext {
  editor: RichTextWrapper;
  transaction: RichTextTransaction;
}

export interface RichTextCommandRegistry {
  execute(command: RichTextCommand): boolean;
}

type HTMLContent = string
type JSONContent = {
  type?: string;
  attrs?: Record<string, any> | undefined;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};
export type Content = HTMLContent | JSONContent | JSONContent[] | null;

export type LinkMarkAttributes = {
  href: string;
  target?: string | null;
  rel?: string | null;
  class?: string | null;
}

export type TextAlign = "left" | "center" | "right" | "justify"

export interface RichTextTransaction {
  focus(): this;
  // insertText(text: string, position?: number): this;
  insertContent(text: Content): this;
  setMark(name: string, attributes?: Record<string, any>): this;
  unsetMark(name: string, options?: { extendEmptyMarkRange?: boolean }): this;
  isMarkTogglable(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }): boolean
  toggleMark(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }): this;
  updateAttribute(typeOrName: string | any, attributes: Record<string, any>): this;

  setLink(attributes: LinkMarkAttributes): this
  toggleLink(attributes?: LinkMarkAttributes): this
  unsetLink(): this

  extendMarkRange(name: string): this;
  setNode(name: string, attributes?: Record<string, any>): this;
  setMeta(key: string, value: any): this;
  clearNodes(): this
  isNodeTogglable(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>): boolean
  toggleNode(typeOrName: string | any, toggleTypeOrName: string | any, attributes?: Record<string, any>): this

  selectTextblockEnd(): this
  setTextSelection(from: number, to: number): this
  setNodeSelection(node: any): this

  // schema-list extensions
  liftListItem?: (typeOrName: string | any) => this
  lift?: (typeOrName: string | any) => this
  isWrapTogglable(typeOrName: string | any, attributes?: Record<string, any>): boolean
  isListTogglable(listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>): boolean
  isTaskListTogglable(): boolean
  isBulletListTogglable(): boolean
  isOrderedListTogglable(): boolean
  wrapIn?: (typeOrName: string | any, attributes?: Record<string, any>) => this
  toggleList?: (listTypeOrName: string | any, itemTypeOrName: string | any, keepMarks?: boolean, attributes?: Record<string, any>) => this;
  toggleTaskList?: () => this // "Mod-Shift-9"
  toggleBulletList?: () => this // "Mod-Shift-8"
  toggleOrderedList?: () => this // "Mod-Shift-7"

  // text-alignment extension
  isTextAlignUsable(align: TextAlign): boolean
  setTextAlign?: (align: TextAlign) => this

  commit(): boolean;
  // rollback?(): void;
}

