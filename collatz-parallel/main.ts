const TOTAL = 10_000_000;
const THREADS =
  Number(Bun.env.THREADS ?? "") ||
  (typeof Bun.cpuCount === "number" ? Bun.cpuCount : 4);

type WorkerResult = {
  type: "result";
  workerId: number;
  sumSteps: number;
  count: number;
  maxSteps: number;
  maxN: number;
};

type WorkerStart = {
  type: "start";
  workerId: number;
  start: number;
  end: number;
};

function makeWorker() {
  return new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
  });
}

function spawnWorker(
  workerId: number,
  total: number,
  chunkSize: number,
): Promise<WorkerResult> {
  const start = workerId * chunkSize + 1;
  const end = Math.min(total, start + chunkSize - 1);

  const workerStart: WorkerStart = {
    type: "start",
    workerId,
    start,
    end,
  };

  return new Promise<WorkerResult>((resolve, reject) => {
    const worker = makeWorker();

    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const message = event.data;
      if (message.type === "result") {
        worker.terminate();
        resolve(message);
      }
    };

    worker.onerror = (errorEvent) => {
      worker.terminate();
      reject(errorEvent);
    };

    worker.postMessage(workerStart);
  });
}

async function run() {
  console.log(
    `Starting Collatz for 1…${TOTAL} with ${THREADS} workers (static split)`,
  );

  const t0 = performance.now();
  const chunkSize = Math.ceil(TOTAL / THREADS);
  const workerPromises: Promise<WorkerResult>[] = [];

  for (let workerId = 0; workerId < THREADS; workerId++) {
    workerPromises.push(spawnWorker(workerId, TOTAL, chunkSize));
  }

  const results = await Promise.all(workerPromises);

  let globalSum = 0;
  let globalCount = 0;
  let globalMaxSteps = 0;
  let globalMaxN = 1;

  for (const result of results) {
    globalSum += result.sumSteps;
    globalCount += result.count;

    if (result.count > 0 && result.maxSteps > globalMaxSteps) {
      globalMaxSteps = result.maxSteps;
      globalMaxN = result.maxN;
    }
  }

  const elapsed = performance.now() - t0;
  const avg = globalSum / globalCount;

  console.log(`\nFinished.`);
  console.log(`Counted: ${globalCount.toLocaleString()} numbers`);
  console.log(`Average steps: ${avg.toFixed(4)}`);
  console.log(
    `Max steps seen: ${globalMaxSteps} (at n=${globalMaxN.toLocaleString()})`,
  );
  console.log(`Elapsed: ${elapsed.toFixed(1)} ms`);
}

run();
