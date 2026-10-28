import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/benchmark/index";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";


const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running yjs-quill", glob_count++)
  try {
    let i = -1
    for (const { patches } of txns) {
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {

      }
    }
    assert.equal("", endContent);

  } finally {
  }
}
const argv_start = process.argv.length > 2 ? process.argv[2] : '--start=0'
const argv_end = process.argv.length > 3 ? process.argv[3] : '--end=-1'
const argv_warmup = process.argv.length > 4 ? process.argv[4] : '--warmup=1'
const argv_iterations = process.argv.length > 5 ? process.argv[5] : '--iteration=1'

const start = Number(argv_start.split('=')[1])
const end = Number(argv_end.split('=')[1]) > 0 ? Number(argv_end.split('=')[1]) : undefined
const warmup = Math.max(Number(argv_warmup.split('=')[1]), 1)
const ỉterations = Math.max(Number(argv_iterations.split('=')[1]), 1)

const NAME_FILE = 'yjs-quill'
DATASET_PATH.slice(start, end).forEach(async data => {
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: ỉterations, collectMemory: true, }, NAME_FILE);
  console.log("Yjs-Quill benchmark:\n", data.pathname, "\n", data, result);
})