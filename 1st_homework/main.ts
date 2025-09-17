import { Worker } from "node:worker_threads";

const jobs = Array.from({ length: 8 }, (_, i) => 40 + i);
// [40, 41, 42, 43, 44, 45, 46, 47]

const counterSAB = new SharedArrayBuffer(4);

new Int32Array(counterSAB)[0] = 0;

const threads = 2;

const results: number[] = new Array(jobs.length).fill(0);

async function run() {
  await Promise.all(
    Array.from(
      { length: threads },
      () =>
        new Promise<void>((resolve, reject) => {
          const w = new Worker(new URL("./worker.ts", import.meta.url), {
            workerData: { jobs, counterSAB },
          });

          w.on("message", ({ idx, value }) => {
            results[idx] = value;
          });

          w.on("error", reject);
          w.on("exit", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`Worker exited: ${code}`)),
          );
        }),
    ),
  );

  console.log({ results, sum: results.reduce((a, b) => a + b, 0) });
}

run().catch(console.error);
