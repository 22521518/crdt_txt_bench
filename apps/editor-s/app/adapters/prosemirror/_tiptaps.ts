import { getDefaultExtensions } from "../tiptaps/tiptap-editor-factory";
import { Editor } from "@tiptap/core";

// import { getSchemaSpecByResolvedExtensions } from "@tiptap/react";
// import { Schema } from "@tiptap/pm/model";
// import { JSDOM } from "jsdom";
// const dom = new JSDOM("<!doctype html><html><body></body></html>");
// Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
// Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
// Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
// Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });
// const spec = getProsemirrorSchemaFromTiptapExtension().nodes["taskItem"].schema.spec
// console.log(JSON.stringify(spec))
// const markNodeFromExtensions = getSchemaSpecByResolvedExtensions(getDefaultExtensions())
// console.log(JSON.stringify(markNodeFromExtensions))

export function getProsemirrorPropsFromTiptapLegacy(disableCollaboration: boolean = false) {
  // TODO: maybe need the tiptap core extension
  const defaulExt = getDefaultExtensions()
  const extensions = disableCollaboration ? defaulExt.filter(extension => extension.name !== 'collaboration') : defaulExt
  const editor = new Editor({ extensions });
  return {
    schema: editor.schema,
    plugins: editor.state.plugins
  }
}