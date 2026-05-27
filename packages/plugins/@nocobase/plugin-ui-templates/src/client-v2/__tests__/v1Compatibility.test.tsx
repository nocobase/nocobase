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
import type { ModelConstructor } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

const createLegacyClientMocks = () => {
  const lazy = vi.fn((loader: () => Promise<unknown>) => {
    const Component = () => null;
    Object.assign(Component, { __loader: loader });
    return Component;
  });

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

  return { lazy, Plugin };
};

type LazyComponent = {
  __loader: () => Promise<{ default?: unknown }>;
};

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
    vi.resetModules();
    vi.doMock(['@nocobase', 'client'].join('/'), () => ({
      lazy: mocks.lazy,
      Plugin: mocks.Plugin,
    }));
    vi.doMock('@nocobase/flow-engine', async () => {
      const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');
      return {
        ...actual,
        useFlowEngine: () => ({
          context: {
            t: (key: string) => key,
          },
        }),
        useFlowContext: () => flowContext,
      };
    });
    const { default: PluginBlockReferenceClient } = await import('../../client');
    const { FlowEngine } = await import('@nocobase/flow-engine');

    const registerModels = vi.fn();
    const registerActions = vi.fn();
    const add = vi.fn();
    const app = {
      flowEngine: {
        registerModels,
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

      expect(registerModels).toHaveBeenCalledWith(
        expect.objectContaining({
          ReferenceBlockModel: expect.any(Function),
          ReferenceFormGridModel: expect.any(Function),
          SubModelTemplateImporterModel: expect.any(Function),
        }),
      );
      expect(registerActions).toHaveBeenCalledWith(expect.objectContaining({ openView: expect.any(Object) }));

      const registeredModels = registerModels.mock.calls[0][0] as Record<string, ModelConstructor>;
      const engine = new FlowEngine();
      engine.registerModels(registeredModels);
      expect(engine.createModel({ uid: 'reference-block', use: 'ReferenceBlockModel' })).toBeInstanceOf(
        registeredModels.ReferenceBlockModel,
      );
      expect(engine.createModel({ uid: 'reference-grid', use: 'ReferenceFormGridModel' })).toBeInstanceOf(
        registeredModels.ReferenceFormGridModel,
      );
      expect(engine.createModel({ uid: 'template-importer', use: 'SubModelTemplateImporterModel' })).toBeInstanceOf(
        registeredModels.SubModelTemplateImporterModel,
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

      expect(mocks.lazy).toHaveBeenCalledTimes(2);
      const blockPage = await (settingsByKey['ui-templates.block'].Component as LazyComponent).__loader();
      const popupPage = await (settingsByKey['ui-templates.popup'].Component as LazyComponent).__loader();
      expect(blockPage.default).toBeDefined();
      expect(popupPage.default).toBeDefined();
      expect(blockPage.default).not.toBe(popupPage.default);

      const BlockPage = blockPage.default as React.ComponentType;
      render(
        <App>
          <BlockPage />
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
