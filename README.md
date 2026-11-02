Run in order:
1. pnpm install
2. pnpm rebuild
3. rm -r .\packages\_benchmark\__run_bench\


-- MONACO
! node --import tsx --import ./ignore-css-loader.mjs ./packages/y-monaco/__benchmark/benchmark.ts --start=0 --end=1 --warmup=0

-- OTHER
node --expose-gc --import tsx .\packages\automerge-codemirror/__benchmark/benchmark.ts --start=0 --end=1 --warmup=0                          