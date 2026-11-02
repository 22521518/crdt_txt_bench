import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/_benchmark";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";

import { EditorView } from "@codemirror/view"
import { Repo, DocHandle } from "@automerge/automerge-repo"
import { EditorState } from "@codemirror/state";
import { automergeSyncPlugin } from "../src";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });
Object.defineProperty(dom.window, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16),
  configurable: true,
});

Object.defineProperty(dom.window, "cancelAnimationFrame", {
  value: (id: number) => clearTimeout(id),
  configurable: true,
})

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running automerge-codemirror", typeof dataset_path === 'string' ? dataset_path : dataset_path.pathname, " ", glob_count++)
  const handler = makeHandle({ text: startContent })

  const mount = document.createElement("div");
  const view = new EditorView({
    state: EditorState.create({
      doc: handler.doc().text,
      extensions: [automergeSyncPlugin({ handle: handler, path: ['text'], })],
    }),
    parent: mount
  });

  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        const from = pos;
        const to = from + delHere;
        // let tr = null
        // if (delHere > 0) tr = view.state.update({ changes: { from, to } });
        // if (insContent.length > 0) tr = view.state.update({ changes: { from, insert: insContent } })
        // if (tr) view.dispatch(tr)

        view.dispatch({ changes: { from, to: to, insert: insContent } });
      }
    }
    assert.equal(view.state.doc.toString(), endContent);
    assert.equal(handler.doc().text, endContent);
  } catch (err) {
    console.error(`${NAME_FILE} document mismatch:`, err);
  } finally {
    view.destroy();
    mount.remove()
  }
}

const argv_start = process.argv.length > 2 ? process.argv[2] : '--start=0'
const argv_end = process.argv.length > 3 ? process.argv[3] : '--end=-1'
const argv_warmup = process.argv.length > 4 ? process.argv[4] : '--warmup=1'
const argv_iterations = process.argv.length > 5 ? process.argv[5] : '--iteration=1'

const start = Number(argv_start.split('=')[1])
const end = Number(argv_end.split('=')[1]) > 0 ? Number(argv_end.split('=')[1]) : undefined
const warmup = Math.max(Number(argv_warmup.split('=')[1]), 1)
const iterations = Math.max(Number(argv_iterations.split('=')[1]), 1)

const NAME_FILE = 'automerge-codemirror'
DATASET_PATH.slice(start, end).forEach(async data => {
  console.log(data.pathname)
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: iterations, collectMemory: true, }, NAME_FILE);
  console.log("automerge-codemirror benchmark:\n", "\n", JSON.stringify(result));
})

function makeHandle(contents: { text: string }): DocHandle<{ text: string }> {
  const repo = new Repo({ network: [] })
  const handle = repo.create<{ text: string }>()
  handle.change((d: { text: string }) => { d.text = contents.text })
  return handle
}