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

import { ModelWithExt, ext } from 'json-joy/lib/json-crdt-extensions';
import { FromPm, ProseMirrorFacade } from '@jsonjoy.com/collaborative-prosemirror';
import { PeritextBinding } from '@jsonjoy.com/collaborative-peritext';

const dom = new JSDOM("<!doctype html><html><body></body></html>");

Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, "MutationObserver", { value: dom.window.MutationObserver, configurable: true });

let glob_count = 0
function run_bench(dataset_path: string | URL) {
  const { startContent, endContent, txns } = parse_sequential_joseph(dataset_path);
  console.log("Start running jsonjoy-prosemirror", glob_count++);

  const initialDoc = schema.node("doc", null, [
    schema.node("paragraph", null, startContent.length > 0 ? [schema.text(startContent)] : []),
  ]);

  // Tạo model Peritext mới cho mỗi iteration.
  const model = ModelWithExt.create(ext.peritext.new(""));
  const txt = model.s.toExt().peritext();

  // Chuyển document ProseMirror ban đầu thành Peritext.
  const viewRange = FromPm.convert(initialDoc);
  txt.editor.merge(viewRange);
  txt.refresh();
  const peritextRef = () => model.s.toExt();

  const state = EditorState.create({ schema, doc: initialDoc });
  const mount = document.createElement("div");
  const view = new EditorView(mount, { state });

  const facade = new ProseMirrorFacade(view, peritextRef);
  const unbind = PeritextBinding.bind(peritextRef, facade);

  try {
    // Kết nối ProseMirror với Y type theo API v2.
    // configureYProsemirror({ ytype })(view.state, view.dispatch);
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

    const finalContent = view.state.doc.textContent;
    assert.equal(finalContent, endContent);

    return finalContent;
  } finally {
    unbind();
    facade.dispose();
    view.destroy();
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

const NAME_FILE = 'jjsonjoy_prosemirror'
DATASET_PATH.slice(start, end).forEach(async data => {
  console.log(data.pathname)
  const result = await benchmark(run_bench, data, { warmup: warmup, iterations: ỉterations, collectMemory: true, }, NAME_FILE);
  console.log("JsonJoy + Peritext + ProseMirror benchmark:\n", "\n", JSON.stringify(result));
})