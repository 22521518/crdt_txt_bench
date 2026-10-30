import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/_benchmark/index";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";

import { EditorView } from 'codemirror';
import { bind } from '@jsonjoy.com/collaborative-codemirror';
import { Model } from 'json-joy/lib/json-crdt';

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

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running jsonjoy-codemirror", typeof dataset_path === 'string' ? dataset_path : dataset_path.pathname, " ", glob_count++)

  const model = Model.create(startContent);
  const crdt_api = () => model.s.$

  const mount = document.createElement('div')
  const view = new EditorView({ extensions: [getLanguageExtension(getLanguageFromDatasetPath(dataset_path))], parent: mount })

  const unbind = bind(crdt_api, view)

  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        const from = pos;
        const to = from + delHere;
        view.dispatch({ changes: { from, to: to, insert: insContent } });
      }
    }

    assert.equal(view.state.doc.toString(), endContent);
    const actual = model.view();
    if (!Array.isArray(actual)) {
      assert.equal(actual, endContent, 'CRDT extension not array text differs from expected');
      // throw new Error(`model.view() did not return an array\n ${actual}`); 
    } else {
      const actualText = actual.map((op: { insert: string }) => op.insert).join('');
      assert.equal(actualText, endContent, 'CRDT extension text differs from expected');
    }
  } catch (err) {
    console.error(`${NAME_FILE} document mismatch:`, err);
  } finally {
    unbind()
    model.api.stopAutoFlush?.();
    view.destroy()
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

const NAME_FILE = 'jsonjoy-codemirror'
DATASET_PATH.slice(start, end).forEach(async data => {
  console.log(data.pathname)
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: iterations, collectMemory: true, }, NAME_FILE);
  console.log("jsonjoy-codemirror benchmark:\n", "\n", JSON.stringify(result));
})

import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";

function getLanguageExtension(language: string) {
  switch (language) {
    case "javascript":
    case "typescript":
      return javascript({
        typescript: language === "typescript",
      });

    case "rust":
      return rust();

    case "json":
      return json();

    case "markdown":
      return markdown();

    default:
      return markdown();
  }
}

function getLanguageFromDatasetPath(
  datasetPath: string | URL,
): string {
  const pathname =
    datasetPath instanceof URL
      ? datasetPath.pathname
      : datasetPath;

  const filename = pathname.split("/").pop() ?? "";

  const languageMap: Record<string, string> = {
    "sveltecomponent.json": "svelte",
    "json-crdt-patch.json": "markdown",
    "clownschool_flat.json": "markdown",
    "friendsforever_flat.json": "markdown",
    "json-crdt-blog-post.json": "markdown",
    "rustcode.json": "rust",
    "seph-blog1.json": "markdown",
    "automerge-paper.json": "latex",
  };

  return languageMap[filename] ?? "plaintext";
}