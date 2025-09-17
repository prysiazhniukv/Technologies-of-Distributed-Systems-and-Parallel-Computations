import { parentPort, workerData } from "node:worker_threads";

const { jobs, counterSAB } = workerData as {
  jobs: number[];
  counterSAB: SharedArrayBuffer;
};

const counter = new Int32Array(counterSAB);

function fib(n: number): number {
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
}

while (true) {
  const i = Atomics.add(counter, 0, 1);
  if (i >= jobs.length) break;

  const value = fib(jobs[i]);
  parentPort?.postMessage({ idx: i, value });
}
