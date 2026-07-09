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
  publicationId: 'pub_level_label',
  versionPolicy: 'pinned',
};

const NEXT_SOURCE_BINDING = {
  ...SOURCE_BINDING,
  entryId: 'entry_open_message',
  entryPath: 'src/client/js-items/open-message/index.tsx',
  publicationId: 'pub_open_message',
};

const SETTINGS_DESCRIPTOR: RunJSSourceSettingsDescriptor = {
  publicationId: 'pub_level_label',
  schemaHash: 'schema_level_label',
  defaults: {
    vipColor: '#f5222d',
  },
  schema: {
    type: 'object',
    properties: {
      vipColor: {
        type: 'string',
        title: 'VIP color',
      },
    },
  },
};

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

  it('adds JS Item source mode, binding, and hidden RunJS source fields', async () => {
    const { model } = createJSItem({});
    const flow = model.getFlow('jsSettings');
    const sourceModeStep = flow?.steps?.sourceMode;
    const sourceBindingStep = flow?.steps?.sourceBinding;
    const runJsStep = flow?.steps?.runJs;

    expect(sourceModeStep?.useRawParams).toBe(true);
    const listSourceMenuItems = vi.fn(async () => []);
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: () => ({
        code: '',
      }),
      listSourceMenuItems,
    });
    await (
      sourceModeStep?.uiMode as { props?: { loadItems?: (input: unknown) => Promise<unknown> } }
    )?.props?.loadItems?.({
      params: {
        sourceMode: 'inline',
      },
      defaultParams: {},
      t: (key: string) => key,
    });
    expect(listSourceMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'js-item',
        defaultVersionPolicy: 'follow-active',
      }),
    );
    expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component']).toBe('JSItemLightExtensionFullSourceField');
    expect(sourceModeStep?.uiSchema?.sourceMode?.['x-component-props']).toMatchObject({
      kind: 'js-item',
      defaultVersionPolicy: 'follow-active',
    });
    expect(sourceModeStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(sourceModeStep?.uiSchema?.settings?.['x-display']).toBe('hidden');
    expect(sourceBindingStep?.hideInSettings).toBe(true);
    expect(sourceBindingStep?.uiSchema?.sourceBinding?.['x-component']).toBe('JSItemLightExtensionFullSourceField');
    expect(sourceBindingStep?.uiSchema?.sourceBinding?.['x-component-props']).toMatchObject({
      kind: 'js-item',
      defaultVersionPolicy: 'follow-active',
    });
    expect(runJsStep?.uiSchema?.sourceMode?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.sourceBinding?.['x-display']).toBe('hidden');
    expect(runJsStep?.uiSchema?.settings?.['x-display']).toBe('hidden');

    expect(sourceModeStep?.defaultParams?.(model.context as FlowSettingsContext<JSItemModel>)).toEqual({
      sourceMode: 'inline',
      sourceBinding: undefined,
      settings: {},
    });
    expect(() => sourceModeStep?.beforeParamsSave?.(model.context, { sourceMode: 'light-extension' }, {})).toThrow(
      'Light extension source binding is required.',
    );

    sourceModeStep?.beforeParamsSave?.(
      model.context as FlowSettingsContext<JSItemModel>,
      {
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          vipColor: '#f5222d',
        },
      },
      {},
    );
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        vipColor: '#f5222d',
      },
    });
  });

  it('generates runtime settings steps from the JS Item settings schema', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      getSettingsDescriptor: vi.fn(async () => SETTINGS_DESCRIPTOR),
      resolve: () => ({
        code: 'ctx.render("level");',
      }),
    });
    const { model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
      settings: {
        vipColor: '#f5222d',
      },
    });

    const steps = await model.getRuntimeFlowSettingSteps('jsSettings');

    expect(Object.values(steps || {}).map((step) => step.title)).toEqual(['VIP color']);
    expect(Object.values(steps || {})[0]?.uiSchema?.value?.['x-component']).toBe(
      'JSItemLightExtensionSettingsStepField',
    );
  });

  it('resolves JS Item publications and injects item, record, settings, and source metadata', async () => {
    const resolve = vi.fn(() => ({
      code: `
ctx.render(
  <span data-testid="level-label" style={{ color: ctx.settings.vipColor }}>
    {ctx.item.index}:{ctx.record.level}:{ctx.settings.vipColor}:{ctx.runJsSource.context.lightExtension.publicationId}
  </span>
);
      `,
      version: 'v2',
      settings: {
        vipColor: '#f5222d',
      },
      context: {
        lightExtension: {
          publicationId: 'pub_level_label',
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
      expect(screen.getByTestId('level-label')).toHaveTextContent('2:VIP:#f5222d:pub_level_label');
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
      sourceBindingStep?.beforeParamsSave?.(
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

  it('reports resolver failures with JS Item binding and owner locator metadata', async () => {
    const reportRuntimeError = vi.fn();
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve: async () => {
        throw Object.assign(new Error('publication missing'), {
          code: 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
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
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
    });

    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('publication missing');
    });
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.itemSettings',
            modelUid: model.uid,
            use: 'JSItemModel',
          }),
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });

  it('isolates component event errors to the current JS Item and reports metadata', async () => {
    const reportRuntimeError = vi.fn();
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
            publicationId: 'pub_level_label',
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
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocator: expect.objectContaining({
            kind: 'flowModel.itemSettings',
            modelUid: model.uid,
            use: 'JSItemModel',
          }),
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });

  it('isolates DOM event listener errors to the current JS Item and reports metadata', async () => {
    const reportRuntimeError = vi.fn();
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
            publicationId: 'pub_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });

  it('protects event listeners added after querying a React-rendered item node', async () => {
    const reportRuntimeError = vi.fn();
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
            publicationId: 'pub_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
    });

    renderModel(engine, model);

    await waitFor(() => {
      expect(screen.getByTestId('queried-react-level-label')).toHaveAttribute('data-listener-ready', 'true');
    });
    fireEvent.click(screen.getByTestId('queried-react-level-label'));

    await waitFor(() => {
      expect(screen.getByTestId('js-item-runtime-error')).toHaveTextContent('queried react click failed');
    });
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
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
    const reportRuntimeError = vi.fn();
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
            publicationId: 'pub_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
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
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
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
}, 100);
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

    await act(async () => {
      sourceBindingStep?.beforeParamsSave?.(
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

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getByTestId('new-item-content').closest('[data-old-timeout-fired="true"]')).toBeNull();
  });

  it('scopes safe document queries to the current JS Item subtree', async () => {
    const reportRuntimeError = vi.fn();
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
            publicationId: 'pub_level_label',
            entryPath: 'src/client/js-items/level-label/index.tsx',
          },
        },
      }),
    });
    const { engine, model } = createJSItem({
      sourceMode: 'light-extension',
      sourceBinding: SOURCE_BINDING,
    });
    model.context.defineProperty('reportRuntimeError', {
      value: reportRuntimeError,
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
    await waitFor(() => {
      expect(reportRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'repo_items',
          entryId: 'entry_level_label',
          publicationId: 'pub_level_label',
          ownerKind: 'flowModel.itemSettings',
          path: 'src/client/js-items/level-label/index.tsx',
          ownerLocatorHash: expect.stringMatching(/^(sha256|local):/),
        }),
      );
    });
  });
});
