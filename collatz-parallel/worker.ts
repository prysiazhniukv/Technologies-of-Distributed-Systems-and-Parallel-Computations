type StartMessage = {
  type: "start";
  workerId: number;
  start: number;
  end: number;
};

type ResultMessage = {
  type: "result";
  workerId: number;
  sumSteps: number;
  count: number;
  maxSteps: number;
  maxN: number;
};

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

self.onmessage = (event: MessageEvent<StartMessage>) => {
  const { start, end, workerId } = event.data;

  if (start > end) {
    (self as DedicatedWorkerGlobalScope).postMessage({
      type: "result",
      workerId,
      sumSteps: 0,
      count: 0,
      maxSteps: 0,
      maxN: start,
    } satisfies ResultMessage);
    return;
  }

  let sumSteps = 0;
  let count = 0;
  let maxSteps = 0;
  let maxN = start;

  for (let n = start; n <= end; n++) {
    const s = collatzSteps(n);
    sumSteps += s;
    count++;
    if (s > maxSteps) {
      maxSteps = s;
      maxN = n;
    }
  }

  (self as DedicatedWorkerGlobalScope).postMessage({
    type: "result",
    workerId,
    sumSteps,
    count,
    maxSteps,
    maxN,
  } satisfies ResultMessage);
};
