import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

function monteCarlo(samples: number): number {
  let circlePoints = 0;
  for (let i = 0; i < samples; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x * x + y * y <= 1) circlePoints++;
  }
  return circlePoints;
}

if (!isMainThread) {
  const circlePoints = monteCarlo(workerData.samples);
  parentPort!.postMessage(circlePoints);
}
