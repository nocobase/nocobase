/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App } from 'antd';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { CollectionOptions, ModelConstructor } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

const createLegacyClientMocks = () => {
  class Plugin {
    app: unknown;
    engine: unknown;
    flowEngine: unknown;

    constructor(_options: unknown, app: { flowEngine?: unknown }) {
      this.app = app;
      this.engine = app.flowEngine;
      this.flowEngine = app.flowEngine;
    }
  }

  return { Plugin };
};

type ComponentLoader = () => Promise<{ default?: unknown }>;

describe('PluginBlockReferenceClient v1 compatibility', () => {
  afterEach(() => {
    cleanup();
    vi.doUnmock(['@nocobase', 'client'].join('/'));
    vi.doUnmock('@nocobase/flow-engine');
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('keeps the legacy settings entries backed by the v2 implementation', async () => {
    const mocks = createLegacyClientMocks();
    const list = vi.fn().mockResolvedValue({
      data: {
        rows: [{ uid: 'tpl-1', name: 'Template A', usageCount: 0 }],
        count: 1,
      },
    });
    const flowContext = {
      api: {
        resource: vi.fn((name: string) => {
          expect(name).toBe('flowModelTemplates');
          return {
            list,
            update: vi.fn(),
            destroy: vi.fn(),
          };
        }),
      },
      viewer: {
        drawer: vi.fn(),
      },
    };
    type TestField = NonNullable<CollectionOptions['fields']>[number] & {
      getFields: () => TestField[];
      getInterfaceOptions: () => {
        filterable: {
          operators: Array<{ label: string; value: string }>;
        };
      };
    };
    type TestCollection = CollectionOptions & {
      getFields: () => TestField[];
    };
    const makeField = (field: NonNullable<CollectionOptions['fields']>[number]): TestField => ({
      ...field,
      getFields: () => [],
      getInterfaceOptions: () => ({
        filterable: {
          operators: [{ label: 'contains', value: '$includes' }],
        },
      }),
    });
    const collections = new Map<string, TestCollection>();
    const dataSource = {
      getCollection: vi.fn((name: string) => collections.get(name)),
      addCollection: vi.fn((collection: CollectionOptions) => {
        collections.set(collection.name, {
          ...collection,
          getFields: () => (collection.fields || []).map(makeField),
        });
      }),
      removeCollection: vi.fn((name: string) => {
        collections.delete(name);
      }),
    };
    const dataSourceManager = {
      getDataSource: vi.fn((name: string) => (name === 'main' ? dataSource : undefined)),
    };
    vi.resetModules();
    vi.doMock(['@nocobase', 'client'].join('/'), () => ({
      Plugin: mocks.Plugin,
    }));
    const { default: PluginBlockReferenceClient } = await import('../../client');
    const { FlowEngine, FlowEngineProvider } = await import('@nocobase/flow-engine');

    const registerModelLoaders = vi.fn();
    const registerActions = vi.fn();
    const add = vi.fn();
    const app = {
      flowEngine: {
        registerModelLoaders,
        getAction: vi.fn(() => ({
          handler: vi.fn(),
          beforeParamsSave: vi.fn(),
          uiSchema: {
            uid: { type: 'string' },
          },
        })),
        registerActions,
      },
      pluginSettingsManager: {
        add,
      },
    };

    const plugin = new PluginBlockReferenceClient({}, app as never);

    try {
      await plugin.load();

      expect(registerModelLoaders).toHaveBeenCalledWith(
        expect.objectContaining({
          ReferenceBlockModel: expect.objectContaining({ loader: expect.any(Function) }),
          ReferenceFormGridModel: expect.objectContaining({ loader: expect.any(Function) }),
          SubModelTemplateImporterModel: expect.objectContaining({ loader: expect.any(Function) }),
        }),
      );
      expect(registerActions).toHaveBeenCalledWith(expect.objectContaining({ openView: expect.any(Object) }));

      const registeredModelLoaders = registerModelLoaders.mock.calls[0][0];
      const engine = new FlowEngine();
      engine.registerModelLoaders(registeredModelLoaders);
      const ReferenceBlockModel = (await engine.getModelClassAsync('ReferenceBlockModel')) as ModelConstructor;
      const ReferenceFormGridModel = (await engine.getModelClassAsync('ReferenceFormGridModel')) as ModelConstructor;
      const SubModelTemplateImporterModel = (await engine.getModelClassAsync(
        'SubModelTemplateImporterModel',
      )) as ModelConstructor;
      expect(engine.createModel({ uid: 'reference-block', use: 'ReferenceBlockModel' })).toBeInstanceOf(
        ReferenceBlockModel,
      );
      expect(engine.createModel({ uid: 'reference-grid', use: 'ReferenceFormGridModel' })).toBeInstanceOf(
        ReferenceFormGridModel,
      );
      expect(engine.createModel({ uid: 'template-importer', use: 'SubModelTemplateImporterModel' })).toBeInstanceOf(
        SubModelTemplateImporterModel,
      );

      const { BlockModel } = await import('@nocobase/client-v2');
      const block = new BlockModel({ uid: 'legacy-plugin-test-block', use: 'BlockModel', flowEngine: engine });
      const menuItems = await BlockModel.getExtraMenuItems(block, (key: string) => key);
      expect(menuItems.filter((item) => item.key === 'block-reference:convert-to-template')).toHaveLength(1);

      const settingsByKey = Object.fromEntries(add.mock.calls.map(([key, options]) => [key, options]));
      expect(settingsByKey['ui-templates']).toMatchObject({
        icon: 'ProfileOutlined',
        aclSnippet: 'pm.ui-templates.templates',
      });
      expect(settingsByKey['ui-templates.block']).toMatchObject({
        aclSnippet: 'pm.ui-templates.templates',
      });
      expect(settingsByKey['ui-templates.popup']).toMatchObject({
        aclSnippet: 'pm.ui-templates.templates',
      });

      const blockPage = await (settingsByKey['ui-templates.block'].componentLoader as ComponentLoader)();
      const popupPage = await (settingsByKey['ui-templates.popup'].componentLoader as ComponentLoader)();
      expect(blockPage.default).toBeDefined();
      expect(popupPage.default).toBeDefined();
      expect(blockPage.default).not.toBe(popupPage.default);

      engine.context.defineProperty('api', { value: flowContext.api });
      engine.context.defineProperty('viewer', { value: flowContext.viewer });
      engine.context.defineProperty('dataSourceManager', { value: dataSourceManager });
      engine.context.defineProperty('t', { value: (key: string) => key });
      engine.context.defineProperty('app', { value: { dataSourceManager } });

      const BlockPage = blockPage.default as React.ComponentType;
      render(
        <App>
          <FlowEngineProvider engine={engine}>
            <BlockPage />
          </FlowEngineProvider>
        </App>,
      );
      await waitFor(() => {
        expect(list).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: {
              $or: [{ type: { $ne: 'popup' } }, { type: { $empty: true } }],
            },
          }),
        );
      });
      expect(await screen.findByText('Template A')).toBeTruthy();
    } finally {
      const { registerMenuExtensions } = await import('../menuExtensions');
      registerMenuExtensions()();
    }
  });
});
