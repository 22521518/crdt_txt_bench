
import { benchmark, compareBenchmarkResult } from "./src/benchmark";

function sumLoop(arr: number[]): number {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  return sum;
}

function sumReduce(arr: number[]): number { return arr.reduce((sum, value) => sum + value, 0); }

const input = Array.from({ length: 100_000 }, (_, i) => i + 1);
const loopResult = await benchmark(sumLoop, input, { warmup: 100, iterations: 1000, collectMemory: false });
const loopResult2 = await benchmark(sumLoop, input, { warmup: 100 * 100, iterations: 1000 });

console.log("=== sumLoop ===");
console.log(JSON.stringify(loopResult, null, 2));
console.log("=== compare sumLoop ===");
console.log(JSON.stringify(compareBenchmarkResult(loopResult, loopResult2), null, 2));

// const reduceResult = await benchmark(sumReduce, input, { warmup: 100, iterations: 1000, collectMemory: false });
// const reduceResult2 = await benchmark(sumReduce, input, { warmup: 100 * 100, iterations: 1000 });
// console.log("=== sumReduce ===");
// console.log(JSON.stringify(reduceResult, null, 2));
// console.log("=== compare sumReduce ===");
// console.log(JSON.stringify(compareBenchmarkResult(reduceResult, reduceResult2), null, 2));
