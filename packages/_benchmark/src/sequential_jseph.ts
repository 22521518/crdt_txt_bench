import fs, { stat } from 'fs';
import path from 'path'
import stats from '../jspeh_utils/stats.js';
import check from '../jspeh_utils/check.js';

const DATASET_PATH = [
  new URL('../data/sequential-edit/sveltecomponent.json', import.meta.url), //  8 > 10000
  new URL('../data/sequential-edit/json-crdt-patch.json', import.meta.url), //  5 > 10000
  new URL('../data/sequential-edit/clownschool_flat.json', import.meta.url), //  2 > 20000
  new URL('../data/sequential-edit/friendsforever_flat.json', import.meta.url), //  3 > 20000
  new URL('../data/sequential-edit/json-crdt-blog-post.json', import.meta.url), //  4 > 20000
  new URL('../data/sequential-edit/rustcode.json', import.meta.url), //  6 > 30000
  new URL('../data/sequential-edit/seph-blog1.json', import.meta.url), //  7 > 130000
  new URL('../data/sequential-edit/automerge-paper.json', import.meta.url), //  1 > 250000 
];

export const get_the_minimal_set = () => DATASET_PATH[7];

export type Patch = [pos: number, delHere: number, insContent: string];
export type Txn = { patches: Patch[]; };
type ReplayData = {
  startContent: string;
  endContent: string;
  txns: Txn[];
};

export function parse_sequential_joseph(filename: string | URL): ReplayData {
  return JSON.parse(fs.readFileSync(filename, "utf-8")) as ReplayData;
}

export { stats, check, DATASET_PATH };

function main() {
  // check(DATASET_PATH[0]);
  console.log(import.meta.filename)
  if (process.argv[2] === '--all-stats') {
    for (const dsp of DATASET_PATH) {
      console.log(dsp.pathname)
      // stats(dsp);
      console.log('\n')
    }
  }
}

const isMain = path.resolve(import.meta.filename) === path.resolve(process.argv[1]);

if (isMain) {
  main();
}