import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/benchmark/index";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { LoroDoc } from "loro-crdt";
import { LoroSyncPlugin } from "../src";
import { getLoroMapChildren, ROOT_DOC_KEY, type LoroDocType, } from "../src";

import { LoroText } from "loro-crdt";

function getLoroText(doc: LoroDocType): string {
  const root = doc.getMap(ROOT_DOC_KEY);
  const children = getLoroMapChildren(root);

  return children.toArray().map((child) => {
    if (child instanceof LoroText) return child.toString();
    return "";
  }).join("");
}

const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running loro-prosemirror ", glob_count++)

  const doc = new LoroDoc() as LoroDocType
  const initialDoc = schema.node("doc", null, [
    schema.node(
      "paragraph",
      null,
      startContent.length > 0 ? [schema.text(startContent)] : [],
    ),
  ]);
  const plugins = [LoroSyncPlugin({ doc })]
  const state = EditorState.create({ schema, doc: initialDoc, plugins })
  const mount = document.createElement("div");
  const view = new EditorView(mount, { state: state });
  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        const from = pos + 1;
        const to = from + delHere;
        let tr = view.state.tr;

        if (delHere > 0) tr = tr.delete(from, to);
        if (insContent.length > 0) tr = tr.insertText(insContent, from);

        view.dispatch(tr);
      }
    }

    assert.equal(getLoroText(doc), endContent);
  } finally {
    view.destroy();
  }
}

const NAME_FILE = 'loro_prosemirror'
DATASET_PATH.forEach(async data => {
  const result = await benchmark(run_bench, data, { warmup: 3, iterations: 1, collectMemory: true, }, NAME_FILE);
  console.log("Loro-ProseMirror benchmark:\n", data.pathname, "\n", data, result);
})