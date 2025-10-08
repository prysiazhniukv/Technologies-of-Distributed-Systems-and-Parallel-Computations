const TOTAL = 10_000_000;
const CHUNK_SIZE = 100_000;
const THREADS =
  Number(Bun.env.THREADS ?? "") ||
  (typeof Bun.cpuCount === "number" ? Bun.cpuCount : 4);

type WorkerMsg =
  | { type: "ready" }
  | {
      type: "done";
      sumSteps: number;
      count: number;
      maxSteps: number;
      maxN: number;
    }
  | { type: "stopped" };

function* makeTasks(total: number, chunk: number) {
  for (let start = 1; start <= total; start += chunk) {
    const end = Math.min(total + 1, start + chunk);
    yield { start, end };
  }
}

function makeWorker() {
  return new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
  });
}

async function run() {
  console.log(
    `Starting Collatz for 1…${TOTAL} with ${THREADS} workers, chunk=${CHUNK_SIZE}`,
  );

  const t0 = performance.now();

  const tasks = makeTasks(TOTAL, CHUNK_SIZE);
  let nextTask = tasks.next();

  let globalSum = 0;
  let globalCount = 0;
  let globalMaxSteps = 0;
  let globalMaxN = 1;

  let activeWorkers = 0;
  const workers: Worker[] = [];

  function assignWork(w: Worker) {
    if (!nextTask.done) {
      w.postMessage(nextTask.value);
      nextTask = tasks.next();
      activeWorkers++;
    } else {
      w.postMessage("stop");
    }
  }

  await new Promise<void>((resolve) => {
    for (let i = 0; i < THREADS; i++) {
      const w = makeWorker();
      workers.push(w);

      w.onmessage = (e: MessageEvent<WorkerMsg>) => {
        const msg = e.data;
        if (msg.type === "ready") {
          assignWork(w);
        } else if (msg.type === "done") {
          activeWorkers--;
          globalSum += msg.sumSteps;
          globalCount += msg.count;

          if (msg.maxSteps > globalMaxSteps) {
            globalMaxSteps = msg.maxSteps;
            globalMaxN = msg.maxN;
          }
          assignWork(w);
        } else if (msg.type === "stopped") {
        }
      };

      w.onerror = (ev) => {
        console.error("Worker error:", ev);

        workers.forEach((ww) => ww.terminate());
        throw ev;
      };
    }

    const interval = setInterval(() => {
      if (nextTask.done && activeWorkers === 0) {
        for (const w of workers) w.terminate();
        clearInterval(interval);

        const t1 = performance.now();
        const avg = globalSum / globalCount;

        console.log(`\nFinished.`);
        console.log(`Counted: ${globalCount.toLocaleString()} numbers`);
        console.log(`Average steps: ${avg.toFixed(4)}`);
        console.log(
          `Max steps seen: ${globalMaxSteps} (at n=${globalMaxN.toLocaleString()})`,
        );
        console.log(`Elapsed: ${(t1 - t0).toFixed(1)} ms`);
        resolve();
      }
    }, 50);
  });
}

run();
