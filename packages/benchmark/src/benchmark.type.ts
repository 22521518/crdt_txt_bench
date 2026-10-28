export type BenchmarkOptions = {
  warmup?: number;      // maybe need for just-in-time compilation optimization
  iterations?: number;
  collectMemory?: boolean;
};

export type BenchmarkMetrics = {
  time: {
    minMs: number;
    maxMs: number;
    meanMs: number;
    medianMs: number;
    percentile95Ms: number;
  };
  memory: {
    heapUsedBeforeMB: number;
    heapUsedAfterMB: number;
    heapDeltaMB: number;
    rssBeforeMB: number;
    rssAfterMB: number;
  };
}

export type BenchmarkMetricDetail = {
  run_th: number;
  time: {
    minMs: number;
    maxMs: number;
  };
  memory: {
    heapUsedBeforeMB: number;
    heapUsedAfterMB: number;
    heapDeltaMB: number;
    rssBeforeMB: number;
    rssAfterMB: number;
  };
}

export type BenchmarkResult = BenchmarkMetrics & {
  iterations: number;
};
