import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/_benchmark/index";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";

import { bind } from '@jsonjoy.com/collaborative-quill';
import { ModelWithExt, ext } from 'json-joy/lib/json-crdt-extensions';

const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });
Object.defineProperty(globalThis, "Node", { value: dom.window.Node, configurable: true });
Object.defineProperty(globalThis, "Element", { value: dom.window.Element, configurable: true });
Object.defineProperty(globalThis, "HTMLElement", { value: dom.window.HTMLElement, configurable: true });
Object.defineProperty(globalThis, "Text", { value: dom.window.Text, configurable: true });

const { default: Quill } = await import("quill");
let glob_count = 0
async function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running jsonjoy-quill", typeof dataset_path === 'string' ? dataset_path : dataset_path.pathname, " ", glob_count++)

  const container = document.createElement("div");
  container.id = "editor";
  document.body.appendChild(container);
  const quill = new Quill(container);

  const model = ModelWithExt.create(ext.quill.new(startContent));
  const quillApi = () => model.s.toExt();
  const unbind = bind(quillApi, quill);

  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        if (delHere > 0) quill.deleteText(pos, delHere, 'api');
        if (insContent.length > 0) quill.insertText(pos, insContent, 'api');
      }
    }

    assert.equal(quill.getText(), endContent + '\n'); // because quill always have \n at the end, and idk why
    const actual = model.view();
    if (!Array.isArray(actual)) { throw new Error('model.view() did not return an array'); }
    const actualText = actual.map((op: { insert: string }) => op.insert).join('');
    assert.equal(actualText, endContent, 'CRDT extension text differs from expected');

  } catch (err) {
    console.error(`${NAME_FILE} document mismatch:`, err);
  } finally {
    unbind()
    model.api.stopAutoFlush?.();
    quill.disable();
    quill.off("text-change");
    quill.off("selection-change");
    quill.off("editor-change");
    quill.root.innerHTML = "";
    quill.container.innerHTML = "";
    container.remove()
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