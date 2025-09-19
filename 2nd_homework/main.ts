import { Worker } from "node:worker_threads";
import { performance } from "node:perf_hooks";
import path from "path";

const SAMPLES = 1_000_000;
const THREADS = 64;
const SAMPLES_PER_THREAD = SAMPLES / THREADS;

function runWorker(samples: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.resolve(__dirname, "montecarlo.ts"), {
      workerData: { samples },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error("Worker stopped with code ${code}"));
    });
  });
}

async function main() {
  const start = performance.now();
  const promises = [];
  for (let i = 0; i < THREADS; i++) {
    promises.push(runWorker(SAMPLES_PER_THREAD));
  }

  const results = await Promise.all(promises);
  const circlePoints = results.reduce((a, b) => a + b, 0);
  const pi = (4 * circlePoints) / SAMPLES;

  const end = performance.now();
  const elapsed = (end - start) / 1000;

  console.log(`Threads: ${THREADS}, PI ≈ ${pi}`);

  console.log(`Execution time: ${elapsed.toFixed(3)}s`);
}

main();
