import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/_benchmark/index";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";

import * as Y from "yjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  MutationObserver: dom.window.MutationObserver,
  Window: dom.window.Window,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Text: dom.window.Text,
  Document: dom.window.Document,
  DocumentFragment: dom.window.DocumentFragment,
  DOMRect: dom.window.DOMRect,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });
Object.defineProperty(dom.window, "requestAnimationFrame", { value: (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16), configurable: true });
Object.defineProperty(dom.window, "cancelAnimationFrame", { value: (id: number) => clearTimeout(id), configurable: true })
Object.defineProperty(dom.window.HTMLElement.prototype, "offsetHeight", { configurable: true, get() { return 0; }, });
Object.defineProperty(dom.window.HTMLElement.prototype, "offsetWidth", { configurable: true, get() { return 0; }, });
Object.defineProperty(dom.window.HTMLElement.prototype, "clientHeight", { configurable: true, get() { return 0; }, });
Object.defineProperty(dom.window.HTMLElement.prototype, "clientWidth", { configurable: true, get() { return 0; }, });
function createRect() {
  return {
    x: 0,
    y: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    toJSON() {
      return {};
    },
  } as DOMRect;
}
const rangePrototype = dom.window.Range.prototype;
rangePrototype.getBoundingClientRect = createRect;
rangePrototype.getClientRects = function () { return { length: 0, item: () => null, [Symbol.iterator]: function* () { }, } as any; };


const { default: CodeMirror } = await import("codemirror");
const { CodemirrorBinding } = await import("y-codemirror");

await import("codemirror/mode/javascript/javascript");
await import("codemirror/mode/rust/rust");
await import("codemirror/mode/markdown/markdown");
await import("codemirror/mode/shell/shell");
await import("codemirror/mode/xml/xml");
await import("codemirror/mode/css/css");
await import("codemirror/mode/htmlmixed/htmlmixed");
await import("codemirror/mode/stex/stex");

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running jsonjoy-quill", typeof dataset_path === 'string' ? dataset_path : dataset_path.pathname, " ", glob_count++)

  const ydoc = new Y.Doc()
  const yText = ydoc.getText('codemirror')
  yText.insert(0, startContent);

  const mount = document.createElement('div')
  const editor = CodeMirror(mount, { mode: getLanguageFromDatasetPath(dataset_path), lineNumbers: false, viewportMargin: 0, })
  const binding = new CodemirrorBinding(yText, editor)

  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        const from = editor.posFromIndex(pos);
        const to = editor.posFromIndex(pos + delHere);
        if (delHere > 0) editor.replaceRange("", from, to);
        if (insContent.length > 0) editor.replaceRange(insContent, from);

      }
    }
    assert.equal(editor.getValue(), endContent);
    assert.equal(yText.toString(), endContent)
  } catch (err) {
    console.error(`${NAME_FILE} document mismatch:`, err);
  } finally {
    binding.destroy()
    const wrapper = editor.getWrapperElement();
    wrapper.remove();
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

const NAME_FILE = 'jsonjoy-quill'
DATASET_PATH.slice(start, end).forEach(async data => {
  console.log(data.pathname)
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: iterations, collectMemory: true, }, NAME_FILE);
  console.log("jsonjoy-Quill benchmark:\n", "\n", JSON.stringify(result));
})

function getLanguageFromDatasetPath(
  datasetPath: string | URL,
): string {
  const pathname =
    datasetPath instanceof URL
      ? datasetPath.pathname
      : datasetPath;

  const filename = pathname.split("/").pop() ?? "";

  const languageMap: Record<string, string> = {
    "sveltecomponent.json": "htmlmixed",
    "json-crdt-patch.json": "markdown",
    "clownschool_flat.json": "markdown",
    "friendsforever_flat.json": "markdown",
    "json-crdt-blog-post.json": "markdown",
    "rustcode.json": "rust",
    "seph-blog1.json": "markdown",
    "automerge-paper.json": "stex",
  };

  return languageMap[filename] ?? "null";
}