
import { performance } from "node:perf_hooks";
import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BenchmarkMetrics, BenchmarkOptions, BenchmarkResult } from "./benchmark.type";

function percentile(sorted: number[], p: number): number {
  sorted.sort((a, b) => a - b)
  const index = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[index];
}

function toMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

function round(value: number, digits = 3): number {
  return Number(value.toFixed(digits));
}
export function get_file(filename?: string) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datetime =
    `${pad(now.getDate())}` +
    `${pad(now.getMonth() + 1)}` +
    `${now.getFullYear()}_` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`;

  const name = filename ?? ''
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.resolve(currentDir, "..", "__run_bench");
  const outputPath = path.join(outputDir, `${name}_${datetime}.json`);
  return outputPath;

}
export function get_dir() {
  return path.dirname(fileURLToPath(import.meta.url));
}

async function saveBenchmarkResult(output: object, save_filename: string): Promise<void> {

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const datetime =
    `${pad(now.getDate())}` +
    `${pad(now.getMonth() + 1)}` +
    `${now.getFullYear()}_` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`;

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const outputDir = path.resolve(currentDir, "..", "__run_bench");
  const outputPath = path.join(outputDir, `${save_filename}_${datetime}.json`);

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`Benchmark result saved to: ${outputPath}`);
}

export async function benchmark<TInput, TOutput>(
  fn: (input: TInput) => TOutput | Promise<TOutput>,
  input: TInput,
  options: BenchmarkOptions = {},
  save_filename: string | null = null
): Promise<BenchmarkResult> {
  const { warmup = 100, iterations = 1000, collectMemory = true } = options;

  if (warmup < 0 || !Number.isInteger(warmup)) throw new Error("warmup must be a non-negative integer");
  if (iterations < 1 || !Number.isInteger(iterations)) throw new Error("iterations must be a positive integer");

  for (let i = 0; i < warmup; i++) await fn(input);  // Warm-up for Just-In-Time compilation optimization

  // Requiring GC if run with --expose-gc
  const gc = (globalThis as typeof globalThis & { gc?: () => void; }).gc;
  if (collectMemory && gc) { gc(); }

  const before = process.memoryUsage();
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn(input);
    const end = performance.now();
    durations.push(end - start);
  }

  const after = process.memoryUsage();
  // durations.sort((a, b) => a - b);
  const total = durations.reduce((sum, t) => sum + t, 0);

  const output = {
    iterations,
    time: {
      minMs: round(Math.min(...durations)),
      maxMs: round(Math.max(...durations)),
      meanMs: round(total / iterations),
      medianMs: round(percentile(durations, 0.5)),
      percentile95Ms: round(percentile(durations, 0.95)),
    },
    memory: {
      heapUsedBeforeMB: round(toMB(before.heapUsed)),
      heapUsedAfterMB: round(toMB(after.heapUsed)),
      heapDeltaMB: round(toMB(after.heapUsed - before.heapUsed),),
      rssBeforeMB: round(toMB(before.rss)),
      rssAfterMB: round(toMB(after.rss)),
    },
  };

  if (save_filename) await saveBenchmarkResult(output, save_filename)
  return output
}

export function compareBenchmarkResult(br1: BenchmarkResult, br2: BenchmarkResult): BenchmarkMetrics {
  return {
    time: {
      minMs: round(br2.time.minMs - br1.time.minMs),
      maxMs: round(br2.time.maxMs - br1.time.maxMs),
      meanMs: round(br2.time.meanMs - br1.time.meanMs),
      medianMs: round(br2.time.medianMs - br1.time.medianMs),
      percentile95Ms: round(br2.time.percentile95Ms - br1.time.percentile95Ms),
    },
    memory: {
      heapUsedBeforeMB: round(br2.memory.heapUsedBeforeMB - br1.memory.heapUsedBeforeMB),
      heapUsedAfterMB: round(br2.memory.heapUsedAfterMB - br1.memory.heapUsedAfterMB),
      heapDeltaMB: round(br2.memory.heapDeltaMB - br1.memory.heapDeltaMB),
      rssBeforeMB: round(br2.memory.rssBeforeMB - br1.memory.rssBeforeMB),
      rssAfterMB: round(br2.memory.rssAfterMB - br1.memory.rssAfterMB),
    },

  }
}