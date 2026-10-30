import { benchmark, DATASET_PATH, get_the_minimal_set, parse_sequential_joseph } from "@workspace/_benchmark/index";
import { JSDOM } from "jsdom";
import assert from "node:assert/strict";

import ResizeObserver from "resize-observer-polyfill";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  self: dom.window,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  MutationObserver: dom.window.MutationObserver,
  ResizeObserver,
  // requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  // cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  requestAnimationFrame:
    dom.window.requestAnimationFrame?.bind(dom.window) ??
    ((callback: FrameRequestCallback) =>
      setTimeout(() => callback(Date.now()), 16) as unknown as number),

  cancelAnimationFrame:
    dom.window.cancelAnimationFrame?.bind(dom.window) ??
    ((id: number) => clearTimeout(id)),
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "self", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });
Object.defineProperty(globalThis, 'HTMLElement', { value: dom.window.HTMLElement, configurable: true, });
Object.defineProperty(globalThis, 'Element', { value: dom.window.Element, configurable: true, });
Object.defineProperty(globalThis, 'MutationObserver', { value: dom.window.MutationObserver, configurable: true, });
Object.defineProperty(dom.window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});
const mockCanvasContext = {
  webkitBackingStorePixelRatio: 1,
  backingStorePixelRatio: 1,

  measureText: (text: string) => ({
    width: text.length * 10,
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 2,
  }),

  fillRect() { },
  clearRect() { },
  strokeRect() { },
  beginPath() { },
  closePath() { },
  moveTo() { },
  lineTo() { },
  stroke() { },
  fill() { },
  save() { },
  restore() { },
  translate() { },
  scale() { },
  rotate() { },
  setTransform() { },
  resetTransform() { },
  transform() { },
  rect() { },
  clip() { },
  arc() { },
  quadraticCurveTo() { },
  bezierCurveTo() { },
  fillText() { },
  strokeText() { },
  drawImage() { },
  putImageData() { },

  getImageData: () => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  }),

  createImageData: () => ({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  }),

  canvas: null as HTMLCanvasElement | null,

  setLineDash() { },
  getLineDash: () => [],

  font: "10px monospace",
  fillStyle: "#000",
  strokeStyle: "#000",
  lineWidth: 1,
  globalAlpha: 1,
  globalCompositeOperation: "source-over",
  textBaseline: "alphabetic",
  textAlign: "start",
};
Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: function (contextType: string) {
    if (contextType === "2d") {
      return Object.assign({}, mockCanvasContext, {
        canvas: this,
      });
    }
    return null;
  },
},);
Object.defineProperty(globalThis, 'matchMedia', {
  value: dom.window.matchMedia,
  configurable: true,
});

const monaco = await import('monaco-editor/esm/vs/editor/editor.api.js');
import type { editor } from "monaco-editor";
const Y = await import('yjs');
const { MonacoBinding } = await import('y-monaco');

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running yjs-monaco", typeof dataset_path === 'string' ? dataset_path : dataset_path.pathname, " ", glob_count++)

  const container = document.createElement("div");
  container.id = "editor";
  document.body.appendChild(container);
  const editor = monaco.editor.create(container, {
    value: startContent,
    language: getLanguageFromDatasetPath(dataset_path),
    automaticLayout: false,
    wordWrap: "on",

    // Disable rendering features
    minimap: { enabled: false, },
    overviewRulerLanes: 0,
    scrollbar: { vertical: "hidden", horizontal: "hidden", },
  });
  editor.getModel()!.setEOL(monaco.editor.EndOfLineSequence.LF);

  const ydoc = new Y.Doc();
  const ytext = ydoc.getText("monaco");
  const monacoBinding = new MonacoBinding(ytext, editor.getModel()!, new Set([editor]),);

  try {
    let i = -1
    // for (const { patches } of txns) {
    for (const [_, txn] of txns.entries()) {
      const { patches } = txn
      assert(patches != null && patches.length > 0);
      if (i % 10000 == 0) console.log(i)
      i++
      for (const [pos, delHere, insContent] of patches) {
        applyPatch(editor, pos, delHere, insContent);
      }
    }

    assert.equal(editor.getValue(), endContent);
    assert.equal(ytext.toString(), endContent, 'CRDT extension text differs from expected');

  } catch (err) {
    console.error(`${NAME_FILE} document mismatch:`, err);
  } finally {
    monacoBinding.destroy()
    editor.dispose();
    container.remove();
  }
}
const argv_start = process.argv.length > 2 ? process.argv[2] : '--start=0'
const argv_end = process.argv.length > 3 ? process.argv[3] : '--end=-1'
const argv_warmup = process.argv.length > 4 ? process.argv[4] : '--warmup=1'
const argv_iterations = process.argv.length > 5 ? process.argv[5] : '--iteration=1'

const start = Number(argv_start.split('=')[1])
const end = Number(argv_end.split('=')[1]) > 0 ? Number(argv_end.split('=')[1]) : undefined
const warmup = Math.max(Number(argv_warmup.split('=')[1]), 0)
const iterations = Math.max(Number(argv_iterations.split('=')[1]), 1)

const NAME_FILE = 'yjs-monaco'
DATASET_PATH.slice(start, end).forEach(async data => {
  console.log(data.pathname)
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: iterations, collectMemory: true, }, NAME_FILE);
  console.log("yjs-monaco benchmark:\n", "\n", JSON.stringify(result));
})

function applyPatch(
  editor: editor.IStandaloneCodeEditor,
  pos: number,
  delHere: number,
  insContent: string,
) {
  const model = editor.getModel();
  if (!model) {
    throw new Error("Monaco model not found");
  }

  const startOffset = pos
  const endOffset = pos + delHere

  const start = model.getPositionAt(startOffset);
  const end = model.getPositionAt(endOffset);

  editor.executeEdits("benchmark", [{
    range: new monaco.Range(
      start.lineNumber,
      start.column,
      end.lineNumber,
      end.column,
    ),
    text: insContent,
  }]);
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