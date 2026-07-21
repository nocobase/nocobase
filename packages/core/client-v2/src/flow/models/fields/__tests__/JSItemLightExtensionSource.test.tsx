/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider, FlowModelRenderer, type FlowSettingsContext } from '@nocobase/flow-engine';
import { RunJSSourceResolverRegistry, type RunJSSourceSettingsDescriptor } from '../../../components/runjs-source';
import { JSItemModel } from '../JSItemModel';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_items',
  entryId: 'entry_level_label',
  entryPath: 'src/client/js-items/level-label/index.tsx',
  kind: 'js-item',
};

const NEXT_SOURCE_BINDING = {
  ...SOURCE_BINDING,
  entryId: 'entry_open_message',
  entryPath: 'src/client/js-items/open-message/index.tsx',
};

function getEmptySettingsDescriptor(sourceBinding: Record<string, unknown>): RunJSSourceSettingsDescriptor {
  const entryId = String(sourceBinding.entryId);
  return {
    entryId,
    settingsSchemaHash: `${entryId}-empty-settings`,
    defaults: {},
    schema: {
      type: 'object',
      properties: {},
    },
  };
}

function createJSItem(stepParams: Record<string, unknown>) {
  const engine = new FlowEngine();
  engine.registerModels({ JSItemModel });
  const model = engine.createModel<JSItemModel>({
    use: 'JSItemModel',
    uid: `js-item-${Math.random()}`,
    stepParams: {
      jsSettings: {
        runJs: stepParams,
      },
    },
  });
  model.context.defineProperty('record', {
    value: {
      name: 'Ada',
      level: 'VIP',
    },
  });
  model.context.defineProperty('item', {
    value: {
      index: 2,
      value: {
        level: 'VIP',
      },
    },
  });
  return { engine, model };
}

function renderModel(engine: FlowEngine, model: JSItemModel) {
  return render(
    <FlowEngineProvider engine={engine}>
      <ConfigProvider>
        <App>
          <FlowModelRenderer model={model} />
        </App>
      </ConfigProvider>
    </FlowEngineProvider>,
  );
}

describe('JSItemModel light extension source', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves JS Item entries and injects item, record, settings, and source metadata', async () => {
    const resolve = vi.fn(() => ({
      code: `
ctx.render(
  <span data-testid="level-label" style={{ color: ctx.settings.vipColor }}>
    {ctx.item.index}:{ctx.record.level}:{ctx.settings.vipColor}:{ctx.runJsSource.context.lightExtension.entryId}
  </span>
);
      `,
      version: 'v2',
      settings: {
        vipColor: '#f5222d',
      },
      context: {
        lightExtension: {
          entryId: 'entry_level_label',
        },
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        vipColor: '#1677ff',
      },
      code: 'ctx.render(<span data-testid="inline-item">inline</span>);',
      version: 'v2',
    });

    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('level-label')).toHaveTextContent('2:VIP:#f5222d:entry_level_label');
    });
    expect(screen.queryByTestId('inline-item')).toBeNull();
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        context: expect.objectContaining({
          modelUid: model.uid,
          ownerKind: 'flowModel.itemSettings',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.itemSettings',
            modelUid: model.uid,
            use: 'JSItemModel',
          }),
        }),
      }),
    );
  });

  it('refreshes the current item after selecting a different JS Item entry', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: async (input) => getEmptySettingsDescriptor(input.sourceBinding),
      resolve: (input) => ({
        code:
          input.sourceBinding?.entryId === 'entry_open_message'
            ? 'ctx.render(<span data-testid="item-content">open:{ctx.record.name}</span>);'
            : 'ctx.render(<span data-testid="item-content">label:{ctx.record.level}</span>);',
        version: 'v2',
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    const sourceBindingStep = model.getFlow('jsSettings')?.steps?.sourceBinding;

    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('item-content')).toHaveTextContent('label:VIP');
    });

    await act(async () => {
      await sourceBindingStep?.beforeParamsSave?.(
        model.context as FlowSettingsContext<JSItemModel>,
        {
          sourceMode: 'light-extension',
          sourceBinding: NEXT_SOURCE_BINDING,
          settings: {},
        },
        {},
      );
      await sourceBindingStep?.afterParamsSave?.(model.context as FlowSettingsContext<JSItemModel>, {}, {});
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-content')).toHaveTextContent('open:Ada');
    });
  });

  it('renders JS Item resolver failures', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('entry missing'), {
          code: 'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
          status: 404,
        });
      },
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        vipColor: '#f5222d',
      },
    });
    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('entry missing');
    });
  });

  it('isolates component event errors to the current JS Item', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
function JsItem() {
  return (
    <button data-testid="broken-level-label" onClick={() => { throw new Error('nested click failed'); }}>
      {ctx.record.level}
    </button>
  );
}

ctx.render(<JsItem />);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        vipColor: '#f5222d',
      },
    });
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <span data-testid="sibling-item">sibling</span>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('broken-level-label')).toHaveTextContent('VIP');
    });
    fireEvent.click(screen.getByTestId('broken-level-label'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('nested click failed');
    });
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
  });

  it('isolates DOM event listener errors to the current JS Item', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
const button = document.createElement('button');
button.setAttribute('data-testid', 'dom-broken-level-label');
button.textContent = ctx.record.level;
button.addEventListener('click', () => {
  throw new Error('dom click failed');
});
ctx.render(button);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <span data-testid="sibling-item">sibling</span>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('dom-broken-level-label')).toHaveTextContent('VIP');
    });
    fireEvent.click(screen.getByTestId('dom-broken-level-label'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('dom click failed');
    });
    expect(screen.getByTestId('sibling-item')).toHaveTextContent('sibling');
  });

  it('isolates bare timer errors to the current JS Item', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
ctx.render(<span data-testid="timer-error-item">{ctx.record.level}</span>);
setTimeout(() => {
  throw new Error('timer callback failed');
}, 0);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('timer callback failed');
    });
  });

  it('protects event listeners added after querying a React-rendered item node', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
ctx.render(<button data-testid="queried-react-level-label">{ctx.record.level}</button>);
window.setTimeout(() => {
  const button = ctx.element.querySelector('[data-testid="queried-react-level-label"]');
  button?.addEventListener('click', () => {
    throw new Error('queried react click failed');
  });
  button?.setAttribute('data-listener-ready', 'true');
}, 0);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('queried-react-level-label')).toHaveAttribute('data-listener-ready', 'true');
    });
    fireEvent.click(screen.getByTestId('queried-react-level-label'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('queried react click failed');
    });
  });

  it('keeps event objects scoped to the current JS Item subtree', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
function JsItem() {
  return (
    <button
      data-testid="event-scoped-owned-item"
      onClick={(event) => {
        const escaped = event.currentTarget.ownerDocument.querySelector('[data-testid="sibling-item"]');
        escaped?.setAttribute('data-js-item-escaped', 'true');
        event.currentTarget.setAttribute('data-event-checked', 'true');
      }}
    >
      {ctx.record.level}
    </button>
  );
}

ctx.render(<JsItem />);
        `,
        version: 'v2',
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <button data-testid="sibling-item">sibling</button>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('event-scoped-owned-item')).toHaveTextContent('VIP');
    });
    fireEvent.click(screen.getByTestId('event-scoped-owned-item'));

    await waitFor(() => {
      expect(screen.getByTestId('event-scoped-owned-item')).toHaveAttribute('data-event-checked', 'true');
    });
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-js-item-escaped');
  });

  it('keeps event view, relatedTarget, and composedPath scoped to the current JS Item subtree', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
function JsItem() {
  return (
    <button
      data-testid="event-deep-owned-item"
      onMouseOver={(event) => {
        const fromView = event.nativeEvent.view?.document?.querySelector('[data-testid="sibling-item"]');
        fromView?.setAttribute('data-event-view-escaped', 'true');

        const pathNode = event.nativeEvent.composedPath?.().find((node) => node?.ownerDocument);
        const fromPath = pathNode?.ownerDocument?.querySelector('[data-testid="sibling-item"]');
        fromPath?.setAttribute('data-event-path-escaped', 'true');

        event.nativeEvent.relatedTarget?.setAttribute?.('data-event-related-escaped', 'true');
        event.currentTarget.setAttribute('data-event-deep-checked', 'true');
      }}
    >
      {ctx.record.level}
    </button>
  );
}

ctx.render(<JsItem />);
        `,
        version: 'v2',
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <button data-testid="sibling-item">sibling</button>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('event-deep-owned-item')).toHaveTextContent('VIP');
    });
    fireEvent.mouseOver(screen.getByTestId('event-deep-owned-item'), {
      relatedTarget: screen.getByTestId('sibling-item'),
    });

    await waitFor(() => {
      expect(screen.getByTestId('event-deep-owned-item')).toHaveAttribute('data-event-deep-checked', 'true');
    });
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-event-view-escaped');
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-event-path-escaped');
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-event-related-escaped');
  });

  it('protects event listeners added through live child collections', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
const children = ctx.element.children;
ctx.render(<button data-testid="children-react-level-label">{ctx.record.level}</button>);
window.setTimeout(() => {
  const button = children[0];
  button?.addEventListener('click', () => {
    throw new Error('children click failed');
  });
  button?.setAttribute('data-listener-ready', 'true');
}, 0);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('children-react-level-label').parentElement).toHaveAttribute(
        'data-listener-ready',
        'true',
      );
    });
    fireEvent.click(screen.getByTestId('children-react-level-label'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('children click failed');
    });
  });

  it('does not expose raw DOM nodes through collection callbacks or iterators', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
ctx.render(<button data-testid="collection-proxy-owned-item">{ctx.record.level}</button>);
window.setTimeout(() => {
  const nodes = ctx.element.querySelectorAll('*');
  nodes.forEach((_node, _index, rawCollection) => {
    const escaped = rawCollection[0]?.ownerDocument?.querySelector('[data-testid="sibling-item"]');
    escaped?.setAttribute('data-collection-foreach-escaped', 'true');
  });

  const fromValues = nodes.values().next().value;
  const fromEntries = nodes.entries().next().value?.[1];
  [fromValues, fromEntries].forEach((node, index) => {
    const escaped = node?.ownerDocument?.querySelector('[data-testid="sibling-item"]');
    escaped?.setAttribute(index === 0 ? 'data-collection-values-escaped' : 'data-collection-entries-escaped', 'true');
    node?.setAttribute?.('data-collection-checked', 'true');
  });
}, 0);
        `,
        version: 'v2',
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });

    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <button data-testid="sibling-item">sibling</button>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('collection-proxy-owned-item').closest('[data-collection-checked="true"]'),
      ).not.toBeNull();
    });
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-collection-foreach-escaped');
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-collection-values-escaped');
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-collection-entries-escaped');
  });

  it('cleans stale JS Item listeners and timers before rerunning another entry', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: async (input) => getEmptySettingsDescriptor(input.sourceBinding),
      resolve: (input) => ({
        code:
          input.sourceBinding?.entryId === 'entry_open_message'
            ? 'ctx.render(<span data-testid="new-item-content">new:{ctx.record.name}</span>);'
            : `
ctx.render(<span data-testid="old-item-content">old:{ctx.record.level}</span>);
ctx.element.addEventListener('click', () => {
  ctx.element.setAttribute('data-old-click-fired', 'true');
});
window.setTimeout(() => {
  ctx.element.setAttribute('data-old-timeout-fired', 'true');
}, 60_000);
            `,
        version: 'v2',
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    const sourceBindingStep = model.getFlow('jsSettings')?.steps?.sourceBinding;

    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('old-item-content')).toHaveTextContent('old:VIP');
    });
    const staleTimerCallIndex = setTimeoutSpy.mock.calls.findIndex(([, timeout]) => timeout === 60_000);
    expect(staleTimerCallIndex).toBeGreaterThanOrEqual(0);
    const staleTimerId = setTimeoutSpy.mock.results[staleTimerCallIndex]?.value;

    await act(async () => {
      await sourceBindingStep?.beforeParamsSave?.(
        model.context as FlowSettingsContext<JSItemModel>,
        {
          sourceMode: 'light-extension',
          sourceBinding: NEXT_SOURCE_BINDING,
          settings: {},
        },
        {},
      );
      await sourceBindingStep?.afterParamsSave?.(model.context as FlowSettingsContext<JSItemModel>, {}, {});
    });

    await waitFor(() => {
      expect(screen.getByTestId('new-item-content')).toHaveTextContent('new:Ada');
    });
    fireEvent.click(screen.getByTestId('new-item-content'));
    expect(screen.getByTestId('new-item-content').closest('[data-old-click-fired="true"]')).toBeNull();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(staleTimerId);
    expect(screen.getByTestId('new-item-content').closest('[data-old-timeout-fired="true"]')).toBeNull();
    clearTimeoutSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  });

  it('scopes safe document queries to the current JS Item subtree', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => ({
        code: `
ctx.render(<button data-testid="document-query-owned-item">{ctx.record.level}</button>);
window.setTimeout(() => {
  const sibling = document.querySelector('[data-testid="sibling-item"]');
  sibling?.setAttribute('data-js-item-escaped', 'true');
  sibling?.addEventListener('click', () => {
    throw new Error('host click hijacked');
  });

  const owned = document.querySelector('[data-testid="document-query-owned-item"]');
  owned?.addEventListener('click', () => {
    throw new Error('document scoped click failed');
  });
  owned?.setAttribute('data-listener-ready', 'true');
}, 0);
        `,
        version: 'v2',
        sourceMap: {
          entryPath: 'src/client/js-items/level-label/index.tsx',
        },
        context: {
          lightExtension: {
            entryId: 'entry_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    render(
      <FlowEngineProvider engine={engine}>
        <ConfigProvider>
          <App>
            <button data-testid="sibling-item">sibling</button>
            <FlowModelRenderer model={model} />
          </App>
        </ConfigProvider>
      </FlowEngineProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('document-query-owned-item')).toHaveAttribute('data-listener-ready', 'true');
    });
    expect(screen.getByTestId('sibling-item')).not.toHaveAttribute('data-js-item-escaped');

    fireEvent.click(screen.getByTestId('sibling-item'));
    expect(screen.queryByTestId('js-item-runtime-error')).toBeNull();

    fireEvent.click(screen.getByTestId('document-query-owned-item'));
    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('document scoped click failed');
    });
  });
});
