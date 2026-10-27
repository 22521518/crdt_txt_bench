import {
  benchmark,
  DATASET_PATH,
  get_the_minimal_set,
  parse_sequential_joseph,
} from "@workspace/benchmark/index";

import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import * as Y from "@y/y";
import {
  syncPlugin,
  configureYProsemirror,
  pmnodeToDelta,
} from "@y/prosemirror";

// Import schema thực tế của project bạn
// import { schema } from "../src/schema";

const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running y-prosemirror ", glob_count++)
  const ydoc = new Y.Doc();
  const ytype = ydoc.get("prosemirror");
  const initialDoc = schema.node("doc", null, [
    schema.node("paragraph", null, startContent.length > 0 ? [schema.text(startContent)] : []),
  ]);

  ytype.applyDelta(pmnodeToDelta(initialDoc));
  const state = EditorState.create({ schema, plugins: [syncPlugin()], });

  const mount = document.createElement("div");
  const view = new EditorView(mount, { state });

  try {
    // Kết nối ProseMirror với Y type theo API v2.
    configureYProsemirror({ ytype })(view.state, view.dispatch);
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

    assert.equal(view.state.doc.textContent, endContent);
    return view.state.doc.textContent;
  } finally {
    view.destroy();
    ydoc.destroy();
  }
}

const NAME_FILE = 'yjs_prosemirror'
DATASET_PATH.forEach(async data => {
  const result = await benchmark(run_bench, data, { warmup: 3, iterations: 1, collectMemory: true, }, NAME_FILE);
  console.log("Yjs v2 + ProseMirror benchmark:\n", data.pathname, "\n", data, result);
})

import { get_file } from "@workspace/benchmark/index"

console.log(get_file())