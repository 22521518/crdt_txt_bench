import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/benchmark/index";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { Repo, DocHandle } from "@automerge/automerge-repo"
import { basicSchemaAdapter } from "../src/basicSchema"
import { init } from "../src/index"

const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });

const repo = new Repo({ network: [] })
function makeHandle(contents: { text: string }): DocHandle<{ text: string }> {
  const handle = repo.create<{ text: string }>()
  handle.change((d: { text: string }) => { d.text = contents.text })
  return handle
}

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);

  console.log("Start running automerge-prosemirror ", glob_count++)
  const handle = makeHandle({ text: startContent })
  const { schema, pmDoc, plugin: syncPlugin } = init(handle, ['text'], { schemaAdapter: basicSchemaAdapter })
  const state = EditorState.create({ schema, plugins: [syncPlugin,], doc: pmDoc, })

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

    assert.equal(handle.doc().text, endContent);
  } finally {
    view.destroy();
  }
}

const NAME_FILE = 'automerge_prosemirror'
DATASET_PATH.forEach(async data => {
  const result = await benchmark(run_bench, data, { warmup: 3, iterations: 1, collectMemory: true, }, NAME_FILE);
  console.log("Automerge-ProseMirror benchmark:\n", data.pathname, "\n", data, result);
})