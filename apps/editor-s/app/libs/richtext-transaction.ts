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
export interface RichTextTransaction {
  focus(): this;
  // insertText(text: string, position?: number): this;
  insertContent(text: Content): this;
  // setMark(name: string, attributes?: Record<string, any>): this;
  unsetMark(name: string, options?: { extendEmptyMarkRange?: boolean }): this;
  toggleMark(name: string, attributes?: Record<string, any>, options?: { extendEmptyMarkRange?: boolean }): this;

  setLink(attributes: LinkMarkAttributes): this
  toggleLink(attributes?: LinkMarkAttributes): this
  unsetLink(): this

  extendMarkRange(name: string): this;
  setNode(name: string, attributes?: Record<string, any>): this;
  setMeta(key: string, value: any): this;
  clearNodes(): this

  selectTextblockEnd(): this
  setTextSelection(from: number, to: number): this
  setNodeSelection(node: any): this

  commit(): boolean;
  // rollback?(): void;
}

