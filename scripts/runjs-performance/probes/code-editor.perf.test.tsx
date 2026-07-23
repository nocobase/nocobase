import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { Worker as NodeWorker } from 'node:worker_threads';

import {
  createTypeScriptProjectSession,
  type CodeEditorTypeScriptProject,
} from '@nocobase/client-v2/flow/components/code-editor/typescriptProject';
import type {
  TypeScriptWorkerIncomingMessage,
  TypeScriptWorkerOutgoingMessage,
} from '@nocobase/client-v2/flow/components/code-editor/typescriptWorkerProtocol';

type MessageListener = (event: MessageEvent<TypeScriptWorkerOutgoingMessage>) => void;

class ThreadWorker {
  private readonly worker: NodeWorker;
  private readonly exitPromise: Promise<number>;
  errorCount = 0;
  exited = false;
  terminateCount = 0;
  terminationRequested = false;
  unexpectedExitCount = 0;

  constructor(workerModule: string) {
    const bridge = `
      const { parentPort } = require('node:worker_threads');
      const listeners = { message: [], close: [] };
      const pendingMessages = [];
      globalThis.self = globalThis;
      globalThis.addEventListener = (type, listener) => {
        listeners[type].push(listener);
        if (type === 'message') {
          for (const data of pendingMessages.splice(0)) listener({ data });
        }
      };
      globalThis.postMessage = (message) => parentPort.postMessage(message);
      parentPort.on('message', (data) => {
        if (!listeners.message.length) return pendingMessages.push(data);
        for (const listener of listeners.message) listener({ data });
      });
      parentPort.on('close', () => {
        for (const listener of listeners.close) listener();
      });
      ${workerModule}
    `;
    this.worker = new NodeWorker(bridge, {
      eval: true,
      name: 'runjs-typescript-performance-probe',
    });
    let resolveExit!: (code: number) => void;
    this.exitPromise = new Promise((resolve) => {
      resolveExit = resolve;
    });
    this.worker.once('exit', (code) => {
      this.exited = true;
      if (!this.terminationRequested) this.unexpectedExitCount += 1;
      resolveExit(code);
    });
  }

  addEventListener(type: 'error' | 'message', listener: EventListener | MessageListener): void {
    if (type === 'message') {
      this.worker.on('message', (data: TypeScriptWorkerOutgoingMessage) => {
        if (data.kind === 'error') console.error(`RunJS TypeScript performance worker response: ${data.error}`);
        (listener as MessageListener)({ data } as MessageEvent<TypeScriptWorkerOutgoingMessage>);
      });
      return;
    }
    this.worker.on('error', (error) => {
      this.errorCount += 1;
      console.error(`RunJS TypeScript performance worker failed: ${error.stack || error.message}`);
      (listener as EventListener)({ message: error.message } as unknown as ErrorEvent);
    });
  }

  postMessage(message: TypeScriptWorkerIncomingMessage): void {
    this.worker.postMessage(message);
  }

  terminate(): void {
    if (this.terminationRequested) return;
    this.terminationRequested = true;
    this.terminateCount += 1;
    this.worker.terminate();
  }

  async waitForExit(): Promise<void> {
    await this.exitPromise;
  }
}

function activeWorkerCount(workers: readonly ThreadWorker[]): number {
  return workers.filter((worker) => !worker.exited && !worker.terminationRequested).length;
}

function workerLifecycle(workers: readonly ThreadWorker[]) {
  return {
    createCount: workers.length,
    errorCount: workers.reduce((sum, worker) => sum + worker.errorCount, 0),
    exitCount: workers.filter((worker) => worker.exited).length,
    terminateCount: workers.reduce((sum, worker) => sum + worker.terminateCount, 0),
    unexpectedExitCount: workers.reduce((sum, worker) => sum + worker.unexpectedExitCount, 0),
  };
}

function bundleWorkerModule(): string {
  const script = `
    import { readFile } from 'node:fs/promises';
    import { build } from 'esbuild';
    const result = await build({
      absWorkingDir: process.cwd(),
      bundle: true,
      entryPoints: ['packages/core/client-v2/src/flow/components/code-editor/typescriptProject.worker.ts'],
      format: 'iife',
      platform: 'node',
      plugins: [{
        name: 'raw-typescript-library',
        setup(buildApi) {
          buildApi.onResolve({ filter: /\\.d\\.ts\\?raw$/u }, async (args) => {
            const resolved = await buildApi.resolve(args.path.slice(0, -4), {
              kind: args.kind,
              resolveDir: args.resolveDir,
            });
            return { namespace: 'raw-typescript-library', path: resolved.path };
          });
          buildApi.onLoad({ filter: /.*/u, namespace: 'raw-typescript-library' }, async (args) => ({
            contents: await readFile(args.path, 'utf8'),
            loader: 'text',
          }));
        },
      }],
      target: 'es2022',
      write: false,
    });
    process.stdout.write(result.outputFiles[0].text);
  `;
  return execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 100 * 1024 ** 2,
  });
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'code-editor', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

describe('RunJS CodeEditor performance probe', () => {
  it('records lazy plain editors and real threaded TypeScript sessions', async () => {
    const workerModule = bundleWorkerModule();
    const typeScriptWorkers: ThreadWorker[] = [];
    const typeScriptFactory = () => {
      const worker = new ThreadWorker(workerModule);
      typeScriptWorkers.push(worker);
      return worker;
    };
    const javascriptWorkers: ThreadWorker[] = [];
    const jsonWorkers: ThreadWorker[] = [];
    const javascriptSession = createTypeScriptProjectSession({
      workerFactory: () => {
        const worker = new ThreadWorker(workerModule);
        javascriptWorkers.push(worker);
        return worker;
      },
    });
    const jsonSession = createTypeScriptProjectSession({
      workerFactory: () => {
        const worker = new ThreadWorker(workerModule);
        jsonWorkers.push(worker);
        return worker;
      },
    });
    const plainEditorCreateCounts = {
      javascript: javascriptWorkers.length,
      json: jsonWorkers.length,
    };

    const code = 'const answer: number = 42; answer;';
    const internalErrors: unknown[] = [];
    const project: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.ts',
      files: [{ content: code, path: 'src/main.ts' }],
      onInternalError: (error) => internalErrors.push(error),
    };
    const beforeMemory = process.memoryUsage();
    const first = createTypeScriptProjectSession({ workerFactory: typeScriptFactory });
    const diagnosticsStart = performance.now();
    expect(await first.getDiagnostics(project, code)).toEqual([]);
    const firstDiagnosticsMs = performance.now() - diagnosticsStart;
    const singleWorkerCount = activeWorkerCount(typeScriptWorkers);
    const afterFirstMemory = process.memoryUsage();

    const secondCpuStart = process.cpuUsage();
    const secondStart = performance.now();
    const second = createTypeScriptProjectSession({ workerFactory: typeScriptFactory });
    expect(await second.getDiagnostics(project, code)).toEqual([]);
    const secondWorkerStartupMs = performance.now() - secondStart;
    const secondCpu = process.cpuUsage(secondCpuStart);
    const secondWorkerStartupCpuMs = (secondCpu.user + secondCpu.system) / 1_000;
    const hoverStart = performance.now();
    expect(await first.getHover(project, code.indexOf('answer') + 2, code)).not.toBeNull();
    const firstHoverMs = performance.now() - hoverStart;
    const overlapStart = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 5_100));
    const overlappingWorkerCount = activeWorkerCount(typeScriptWorkers);
    const overlapDurationMs = performance.now() - overlapStart;
    const afterMemory = process.memoryUsage();

    expect(plainEditorCreateCounts).toEqual({ javascript: 0, json: 0 });
    expect(singleWorkerCount).toBe(1);
    expect(overlappingWorkerCount).toBe(2);
    expect(typeScriptWorkers).toHaveLength(2);
    expect(internalErrors).toEqual([]);
    expect(workerLifecycle(typeScriptWorkers)).toEqual({
      createCount: 2,
      errorCount: 0,
      exitCount: 0,
      terminateCount: 0,
      unexpectedExitCount: 0,
    });

    first.dispose();
    second.dispose();
    await Promise.all(typeScriptWorkers.map((worker) => worker.waitForExit()));
    const afterTypeScriptDisposeMemory = process.memoryUsage();
    const typeScriptWorkerLifecycle = workerLifecycle(typeScriptWorkers);
    expect(typeScriptWorkerLifecycle).toEqual({
      createCount: 2,
      errorCount: 0,
      exitCount: 2,
      terminateCount: 2,
      unexpectedExitCount: 0,
    });

    javascriptSession.dispose();
    jsonSession.dispose();
    await Promise.all([...javascriptWorkers, ...jsonWorkers].map((worker) => worker.waitForExit()));
    const javascriptWorkerLifecycle = workerLifecycle(javascriptWorkers);
    const jsonWorkerLifecycle = workerLifecycle(jsonWorkers);
    expect(javascriptWorkerLifecycle.errorCount).toBe(0);
    expect(javascriptWorkerLifecycle.exitCount).toBe(javascriptWorkerLifecycle.createCount);
    expect(javascriptWorkerLifecycle.terminateCount).toBe(javascriptWorkerLifecycle.createCount);
    expect(javascriptWorkerLifecycle.unexpectedExitCount).toBe(0);
    expect(jsonWorkerLifecycle.errorCount).toBe(0);
    expect(jsonWorkerLifecycle.exitCount).toBe(jsonWorkerLifecycle.createCount);
    expect(jsonWorkerLifecycle.terminateCount).toBe(jsonWorkerLifecycle.createCount);
    expect(jsonWorkerLifecycle.unexpectedExitCount).toBe(0);

    writeMeasurement({
      activeWorkerCount: overlappingWorkerCount,
      firstDiagnosticsMs,
      firstHoverMs,
      fallbackCount: internalErrors.length,
      overlapDurationMs,
      overlapHeapDeltaBytes: Math.max(0, afterMemory.heapUsed - beforeMemory.heapUsed),
      overlapRssBytes: Math.max(0, afterMemory.rss - beforeMemory.rss),
      plainEditors: {
        beforeDisposeCreateCounts: plainEditorCreateCounts,
        javascriptWorkerLifecycle,
        jsonWorkerLifecycle,
      },
      postTypeScriptDispose: {
        heapDeltaBytes: Math.max(0, afterTypeScriptDisposeMemory.heapUsed - beforeMemory.heapUsed),
        rssDeltaBytes: Math.max(0, afterTypeScriptDisposeMemory.rss - beforeMemory.rss),
        workerLifecycle: typeScriptWorkerLifecycle,
      },
      secondWorkerStartupCpuMs,
      secondWorkerStartupMs,
      singleTypeScriptEditor: {
        heapDeltaBytes: Math.max(0, afterFirstMemory.heapUsed - beforeMemory.heapUsed),
        rssDeltaBytes: Math.max(0, afterFirstMemory.rss - beforeMemory.rss),
        workerCount: singleWorkerCount,
      },
      transport: 'node-worker-thread-running-typescriptProject.worker.ts',
      workerFactoryCount: typeScriptWorkerLifecycle.createCount,
    });
  });
});
