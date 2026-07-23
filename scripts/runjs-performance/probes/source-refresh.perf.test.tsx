import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FlowContextProvider, FlowEngine, FlowModel, FlowRuntimeContext, FlowStepContext } from '@nocobase/flow-engine';
import { afterEach, expect, test, vi } from 'vitest';

import { RunJSEditorField, RunJSEditorRegistry } from '@nocobase/client-v2/flow/components/runjs-studio';

vi.mock('@nocobase/client-v2/flow/components/code-editor', () => ({
  CodeEditor: () => null,
}));

function percentile95(samples: number[]): number {
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

function writeMeasurement(metrics: Record<string, unknown>): void {
  const output = process.env.RUNJS_PERF_SAMPLE_OUTPUT;
  if (!output) throw new Error('RUNJS_PERF_SAMPLE_OUTPUT is required');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(
    output,
    `${JSON.stringify(
      { schemaVersion: 1, probe: 'source-refresh', phase: process.env.RUNJS_PERF_PHASE, metrics },
      null,
      2,
    )}\n`,
  );
}

afterEach(() => {
  cleanup();
  RunJSEditorRegistry.clear();
});

test('records the production save-refresh path for 500 loaded models and 10 matches', async () => {
  const engine = new FlowEngine();
  const persistedValue = {
    code: 'ctx.render("remote");',
    sourceBinding: {
      type: 'light-extension-entry',
      repoId: 'repo-1',
      entryId: 'entry-1',
      kind: 'js-block',
    },
    sourceMode: 'light-extension',
    settings: { color: 'blue' },
    version: 'v2',
  };
  const models = Array.from({ length: 500 }, (_, index) =>
    engine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: `runjs_perf_${index}`,
      stepParams: {
        jsSettings: {
          runJs: {
            ...persistedValue,
            sourceBinding:
              index < 10
                ? persistedValue.sourceBinding
                : { ...persistedValue.sourceBinding, entryId: `entry-${index}` },
          },
        },
      },
    }),
  );
  const model = models[0];
  const originalForEachModel = engine.forEachModel.bind(engine);
  const originalInvalidateFlowCache = model.invalidateFlowCache.bind(model);
  let modelInvalidationCount = 0;
  let measureScan = false;
  let scanStartedAt = 0;
  let scanMs = 0;
  vi.spyOn(engine, 'forEachModel').mockImplementation((callback) => {
    if (measureScan) scanStartedAt = performance.now();
    originalForEachModel(callback);
  });
  vi.spyOn(model, 'invalidateFlowCache').mockImplementation((eventName, deep) => {
    modelInvalidationCount += 1;
    if (measureScan) {
      scanMs = performance.now() - scanStartedAt;
      measureScan = false;
    }
    originalInvalidateFlowCache(eventName, deep);
  });
  let rerenderMs = 0;
  let rerenderCount = 0;
  for (const loadedModel of models) {
    vi.spyOn(loadedModel, 'rerender').mockImplementation(async () => {
      const started = performance.now();
      await Promise.resolve();
      rerenderMs += performance.now() - started;
      rerenderCount += 1;
    });
  }

  const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
  flowContext.defineMethod('getStepFormValues', () => persistedValue);
  let pendingRefresh: Promise<unknown> | undefined;
  RunJSEditorRegistry.registerProvider({
    key: 'source-refresh-performance-probe',
    canHandle: (props) => props.locator?.kind === 'flowModel.step',
    renderEditor: (props) => (
      <button
        type="button"
        onClick={() => {
          pendingRefresh = Promise.resolve(props.onPersistedChange?.(props.value));
        }}
      >
        refresh source
      </button>
    ),
  });
  render(
    <FlowContextProvider context={flowContext}>
      <FlowStepContext.Provider value={{ params: persistedValue, path: `${model.uid}_jsSettings_runJs` }}>
        <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="action" value={persistedValue} />
      </FlowStepContext.Provider>
    </FlowContextProvider>,
  );

  const scanSamplesMs: number[] = [];
  const postSaveRefreshSamplesMs: number[] = [];
  const rerenderSamplesMs: number[] = [];
  const saveSamplesMs: number[] = [];
  for (let run = 0; run < 30; run += 1) {
    modelInvalidationCount = 0;
    rerenderMs = 0;
    rerenderCount = 0;
    scanMs = 0;
    measureScan = true;
    const started = performance.now();
    fireEvent.click(screen.getByRole('button', { name: 'refresh source' }));
    await pendingRefresh;
    const saveMs = performance.now() - started;
    const postSaveRefreshMs = performance.now() - scanStartedAt;
    expect(rerenderCount).toBe(10);
    expect(modelInvalidationCount).toBe(1);
    expect(scanMs).toBeGreaterThan(0);
    expect(postSaveRefreshMs).toBeGreaterThanOrEqual(scanMs);
    saveSamplesMs.push(saveMs);
    scanSamplesMs.push(scanMs);
    postSaveRefreshSamplesMs.push(postSaveRefreshMs);
    rerenderSamplesMs.push(rerenderMs);
  }
  const scanTotal = scanSamplesMs.reduce((sum, sample) => sum + sample, 0);
  const refreshTotal = postSaveRefreshSamplesMs.reduce((sum, sample) => sum + sample, 0);
  writeMeasurement({
    loadedModels: models.length,
    matchingModels: 10,
    postSaveRefreshSamplesMs,
    rerenderSamplesMs,
    saveSamplesMs,
    scanP95Ms: percentile95(scanSamplesMs),
    scanSamplesMs,
    scanSharePercent: refreshTotal === 0 ? 0 : (scanTotal / refreshTotal) * 100,
    transport: 'RunJSEditorField.onPersistedChange',
  });
});
