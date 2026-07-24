/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import {
  FlowContext,
  FlowEngine,
  FlowEngineProvider,
  FlowModel,
  FlowViewContextProvider,
  setupRunJSContexts,
  type IFlowModelRepository,
} from '@nocobase/flow-engine';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowPage } from '../FlowPage';
import { DEFAULT_JS_PAGE_CODE, JSPageModel } from '../models/base/PageModel';

function clone<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T);
}

class MemoryRepository implements IFlowModelRepository<FlowModel> {
  snapshot: Record<string, unknown> | null;
  readonly saves: Record<string, unknown>[] = [];

  constructor(snapshot: Record<string, unknown> | null = null) {
    this.snapshot = clone(snapshot);
  }

  async findOne(): Promise<Record<string, unknown> | null> {
    return clone(this.snapshot);
  }

  async save(model: FlowModel): Promise<Record<string, unknown>> {
    const snapshot = clone(model.serialize()) as Record<string, unknown>;
    this.snapshot = snapshot;
    this.saves.push(snapshot);
    return clone(snapshot);
  }

  async destroy(): Promise<boolean> {
    return true;
  }

  async move(): Promise<void> {}

  async duplicate(): Promise<Record<string, unknown> | null> {
    return null;
  }
}

async function createRuntime(repository: MemoryRepository) {
  const engine = new FlowEngine();
  const apiRequest = vi.fn(async () => ({ data: { data: [] } }));
  engine.setModelRepository(repository);
  engine.registerModels({ JSPageModel });
  engine.context.defineProperty('t', {
    value: (key: string) => key,
  });
  engine.context.defineProperty('themeToken', {
    value: {
      marginBlock: 16,
      paddingLG: 24,
      paddingSM: 12,
    },
  });
  engine.context.defineProperty('routeRepository', {
    value: {
      getRouteBySchemaUid: () => undefined,
    },
  });
  engine.context.defineProperty('api', {
    value: {
      request: apiRequest,
    },
  });
  engine.createModel({ uid: 'route-1', use: 'FlowModel' });
  await engine.flowSettings.enable();

  const viewContext = new FlowContext();
  viewContext.defineProperty('view', {
    value: {
      active: true,
      inputArgs: {},
    },
  });
  viewContext.defineProperty('pageActive', {
    value: { value: true },
  });
  viewContext.defineProperty('themeToken', {
    value: engine.context.themeToken,
  });

  return { apiRequest, engine, viewContext };
}

async function renderFlowPage(repository: MemoryRepository) {
  const { apiRequest, engine, viewContext } = await createRuntime(repository);
  let loadedModel: FlowModel | undefined;
  const rendered = render(
    <FlowEngineProvider engine={engine}>
      <FlowViewContextProvider context={viewContext}>
        <FlowPage
          parentId="route-1"
          pageModelClass="JSPageModel"
          onModelLoaded={(_uid, model) => {
            loadedModel = model;
          }}
        />
      </FlowViewContextProvider>
    </FlowEngineProvider>,
  );

  expect(await screen.findByText('JavaScript page is ready')).toBeInTheDocument();
  await waitFor(() => expect(loadedModel).toBeInstanceOf(JSPageModel));
  return { apiRequest, engine, loadedModel: loadedModel as JSPageModel, rendered };
}

describe('JS Page FlowPage integration', () => {
  it('persists defaults before the first save and reloads without light-extension APIs', async () => {
    await setupRunJSContexts();
    const repository = new MemoryRepository();
    const first = await renderFlowPage(repository);

    expect(repository.saves).toHaveLength(1);
    expect(repository.saves[0]).toMatchObject({
      use: 'JSPageModel',
      stepParams: {
        pageSettings: {
          general: {
            displayTitle: false,
            enableTabs: false,
          },
        },
        jsSettings: {
          runJs: {
            code: DEFAULT_JS_PAGE_CODE,
            version: 'v2',
            sourceMode: 'inline',
            settings: {},
          },
        },
      },
    });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByText('Add tab')).not.toBeInTheDocument();
    expect(first.apiRequest).not.toHaveBeenCalled();
    await act(async () => {
      first.rendered.unmount();
      await Promise.resolve();
    });

    const persisted = clone(repository.snapshot);
    const reloadedRepository = new MemoryRepository(persisted);
    const second = await renderFlowPage(reloadedRepository);

    expect(reloadedRepository.saves).toHaveLength(0);
    expect(second.loadedModel.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: DEFAULT_JS_PAGE_CODE,
      version: 'v2',
      sourceMode: 'inline',
      settings: {},
    });
    expect(second.apiRequest).not.toHaveBeenCalled();
    await act(async () => {
      second.rendered.unmount();
      await Promise.resolve();
    });
  });
});
