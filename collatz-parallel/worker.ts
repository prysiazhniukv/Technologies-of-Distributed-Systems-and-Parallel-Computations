type Task = { start: number; end: number };

function collatzSteps(n0: number): number {
  let n = n0;
  let steps = 0;
  while (n !== 1) {
    if ((n & 1) === 0) n = n / 2;
    else n = 3 * n + 1;
    steps++;
  }
  return steps;
}

self.onmessage = (e: MessageEvent<Task | "stop">) => {
  const msg = e.data;
  if (msg === "stop") {
    (self as DedicatedWorkerGlobalScope).postMessage({ type: "stopped" });
    return;
  }

  const { start, end } = msg;
  let sumSteps = 0;
  let count = 0;
  let maxSteps = 0;
  let maxN = start;

  for (let n = start; n < end; n++) {
    const s = collatzSteps(n);
    sumSteps += s;
    count++;
    if (s > maxSteps) {
      maxSteps = s;
      maxN = n;
    }
  }

  (self as DedicatedWorkerGlobalScope).postMessage({
    type: "done",
    sumSteps,
    count,
    maxSteps,
    maxN,
  });

  (self as DedicatedWorkerGlobalScope).postMessage({ type: "ready" });
};

(self as DedicatedWorkerGlobalScope).postMessage({ type: "ready" });
