/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { ChartBlockModel } from '../ChartBlockModel';

type ChartQuery = {
  mode?: string;
  collectionPath?: string[];
  measures?: { field?: string | string[] }[];
  dimensions?: { field?: string | string[] }[];
  orders?: { field?: string | string[] }[];
  filter?: unknown;
  sql?: string;
  sqlDatasource?: string;
};

class DummyChartResource {
  refreshCalls = 0;

  async refresh(): Promise<void> {
    this.refreshCalls += 1;
  }
}

class DummyChartBlockModel extends ChartBlockModel {
  readonly testResource = new DummyChartResource();

  override async onInit(_options: unknown): Promise<void> {
    this.context.defineProperty('resource', {
      get: () => this.testResource,
    });
  }
}

function setupModel(query: ChartQuery) {
  const engine = new FlowEngine();
  engine.registerModels({ DummyChartBlockModel });
  addChartCollections(engine);

  const model = engine.createModel<DummyChartBlockModel>({
    uid: 'chart-block',
    use: 'DummyChartBlockModel',
    stepParams: {
      chartSettings: {
        configure: {
          query,
        },
      },
    },
  });

  return { engine, model, resource: model.testResource };
}

function addChartCollections(engine: FlowEngine) {
  const dataSource = engine.dataSourceManager.getDataSource('main');
  dataSource.addCollection({
    name: 'customers',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'input' },
    ],
  });
  dataSource.addCollection({
    name: 'orders',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'amount', type: 'double', interface: 'number' },
      {
        name: 'customer',
        title: 'Customer',
        type: 'belongsTo',
        target: 'customers',
        interface: 'm2o',
        foreignKey: 'customer_id',
      },
    ],
  });
}

describe('ChartBlockModel onActive dirty refresh', () => {
  it('does not refresh builder charts when the configured collection is clean', async () => {
    const { model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });

    await model.refresh();
    resource.refreshCalls = 0;

    await model.onActive();

    expect(resource.refreshCalls).toBe(0);
  });

  it('refreshes builder charts when the configured collection becomes dirty', async () => {
    const { engine, model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });

    await model.refresh();
    resource.refreshCalls = 0;
    engine.markDataSourceDirty('main', 'orders');

    await model.onActive();
    await model.onActive();

    expect(resource.refreshCalls).toBe(1);
  });

  it('does not refresh builder charts for unrelated dirty collections', async () => {
    const { engine, model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });

    await model.refresh();
    resource.refreshCalls = 0;
    engine.markDataSourceDirty('main', 'customers');

    await model.onActive();

    expect(resource.refreshCalls).toBe(0);
  });

  it('refreshes builder charts when activation is forced', async () => {
    const { model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });

    await model.refresh();
    resource.refreshCalls = 0;

    await model.onActive(true);

    expect(resource.refreshCalls).toBe(1);
  });

  it('refreshes builder charts when the query changes for the same collection', async () => {
    const { model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
      measures: [{ field: ['amount'] }],
    });

    await model.refresh();
    resource.refreshCalls = 0;
    model.setStepParams('chartSettings', 'configure', {
      query: {
        mode: 'builder',
        collectionPath: ['main', 'orders'],
        measures: [{ field: ['id'] }],
        filter: {
          logic: '$and',
          items: [{ path: 'amount', operator: '$gt', value: 100 }],
        },
        orders: [{ field: ['amount'] }],
      },
    });

    await model.onActive();
    await model.onActive();

    expect(resource.refreshCalls).toBe(1);
  });

  it('refreshes builder charts when a dimension reads a dirty associated collection', async () => {
    const { engine, model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
      measures: [{ field: ['amount'] }],
      dimensions: [{ field: ['customer', 'name'] }],
    });

    await model.refresh();
    resource.refreshCalls = 0;
    engine.markDataSourceDirty('main', 'customers');

    await model.onActive();
    await model.onActive();

    expect(resource.refreshCalls).toBe(1);
  });

  it('refreshes builder charts when a filter reads a dirty associated collection', async () => {
    const { engine, model, resource } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
      measures: [{ field: ['amount'] }],
      filter: {
        logic: '$and',
        items: [{ path: 'customer.name', operator: '$eq', value: 'Acme' }],
      },
    });

    await model.refresh();
    resource.refreshCalls = 0;
    engine.markDataSourceDirty('main', 'customers');

    await model.onActive();

    expect(resource.refreshCalls).toBe(1);
  });

  it('keeps refreshing SQL charts on active because no collection target is available', async () => {
    const { model, resource } = setupModel({
      mode: 'sql',
      sql: 'select 1',
      sqlDatasource: 'main',
    });

    await model.onActive();
    await model.onActive();

    expect(resource.refreshCalls).toBe(2);
  });
});

describe('ChartBlockModel chart events binding', () => {
  it('runs chart events once for the same chart instance and raw events, then reruns for a new chart instance', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const raw = 'chart.on("click", () => {})';
    const chartA = {} as any;
    const chartB = {} as any;
    const runjs = vi.spyOn(model.context, 'runjs').mockResolvedValue({ success: true, value: undefined });

    await model.applyEvents(raw, chartA);
    await model.applyEvents(raw, chartA);
    await model.applyEvents(raw, chartB);

    expect(runjs).toHaveBeenCalledTimes(2);
    expect(runjs).toHaveBeenNthCalledWith(1, raw, expect.objectContaining({ chart: chartA }));
    expect(runjs).toHaveBeenNthCalledWith(2, raw, expect.objectContaining({ chart: chartB }));
  });

  it('runs the previous cleanup function before applying different raw events', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const chart = {} as any;

    vi.spyOn(model.context, 'runjs').mockImplementation(async (raw: string) => {
      return { success: true, value: raw === 'first' ? firstCleanup : secondCleanup };
    });

    await model.applyEvents('first', chart);
    await model.applyEvents('second', chart);

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondCleanup).not.toHaveBeenCalled();
  });

  it('runs returned cleanup functions when events are cleared', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const cleanup = vi.fn();
    const chart = {} as any;

    vi.spyOn(model.context, 'runjs').mockResolvedValue({ success: true, value: cleanup });

    await model.applyEvents('return cleanup;', chart);
    await model.applyEvents(undefined, chart);

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('ignores stale onRefReady callbacks after chart events are cleared', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const chartRef = { current: null as any };
    const chart = {} as any;
    let readyCallback: (() => Promise<void>) | undefined;
    const runjs = vi.spyOn(model.context, 'runjs').mockResolvedValue({ success: true, value: undefined });

    model.context.defineProperty('chartRef', { value: chartRef });
    vi.spyOn(model.context, 'onRefReady').mockImplementation((_ref: any, callback: any) => {
      readyCallback = callback;
    });

    await model.applyEvents('chart.on("click", () => {})');
    await model.applyEvents(undefined);

    chartRef.current = chart;
    await readyCallback?.();

    expect(runjs).not.toHaveBeenCalled();
  });

  it('ignores stale onRefReady callbacks after chart events are replaced', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const chartRef = { current: null as any };
    const chart = {} as any;
    const readyCallbacks: (() => Promise<void>)[] = [];
    const runjs = vi.spyOn(model.context, 'runjs').mockResolvedValue({ success: true, value: undefined });

    model.context.defineProperty('chartRef', { value: chartRef });
    vi.spyOn(model.context, 'onRefReady').mockImplementation((_ref: any, callback: any) => {
      readyCallbacks.push(callback);
    });

    await model.applyEvents('first');
    await model.applyEvents('second');

    chartRef.current = chart;
    await readyCallbacks[0]?.();
    await readyCallbacks[1]?.();

    expect(runjs).toHaveBeenCalledTimes(1);
    expect(runjs).toHaveBeenCalledWith('second', expect.objectContaining({ chart }));
  });

  it('cleans returned handlers from stale asynchronous chart event runs', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const staleCleanup = vi.fn();
    const activeCleanup = vi.fn();
    const chart = {} as any;
    let resolveFirst: ((value: any) => void) | undefined;
    const firstResult = new Promise<any>((resolve) => {
      resolveFirst = resolve;
    });

    vi.spyOn(model.context, 'runjs')
      .mockReturnValueOnce(firstResult as any)
      .mockResolvedValueOnce({ success: true, value: activeCleanup });

    const firstApply = model.applyEvents('first', chart);
    await model.applyEvents('second', chart);
    resolveFirst?.({ success: true, value: staleCleanup });
    await firstApply;

    await model.applyEvents(undefined, chart);

    expect(staleCleanup).toHaveBeenCalledTimes(1);
    expect(activeCleanup).toHaveBeenCalledTimes(1);
  });

  it('clears the bound marker when chart events throw so the same chart can retry', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const raw = 'chart.on("click", () => {})';
    const chart = {} as any;
    const runjs = vi
      .spyOn(model.context, 'runjs')
      .mockRejectedValueOnce(new Error('events failed'))
      .mockResolvedValueOnce({ success: true, value: undefined });

    await expect(model.applyEvents(raw, chart)).rejects.toThrow('events failed');
    await model.applyEvents(raw, chart);

    expect(runjs).toHaveBeenCalledTimes(2);
  });

  it('handles asynchronous onRefReady chart event failures explicitly', async () => {
    const { model } = setupModel({
      mode: 'builder',
      collectionPath: ['main', 'orders'],
    });
    const raw = 'chart.on("click", () => {})';
    const chart = {} as any;
    const error = new Error('events failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const applyEvents = vi.spyOn(model, 'applyEvents').mockRejectedValue(error);
    model.setProps({ chart: {} } as any);
    model.setStepParams('chartSettings', 'configure', {
      query: {
        mode: 'builder',
        collectionPath: ['main', 'orders'],
      },
      chart: {
        events: {
          raw,
        },
      },
    });

    (model as any).__onChartRefReady(chart);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(applyEvents).toHaveBeenCalledWith(raw, chart);
    expect(consoleError).toHaveBeenCalledWith('Chart applyEvents error:', error);
    consoleError.mockRestore();
  });
});
