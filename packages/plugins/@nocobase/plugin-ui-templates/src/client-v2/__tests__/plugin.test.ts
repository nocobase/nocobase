/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { registerMenuExtensions } from '../menuExtensions';
import { PluginUiTemplatesClientV2 } from '../plugin';

const t = (key: string) => key;

describe('PluginUiTemplatesClientV2', () => {
  it('registers v2 models and settings pages', async () => {
    const registerModelLoaders = vi.fn();
    const registerDynamicFlowSourceProvider = vi.fn();
    const addMenuItem = vi.fn();
    const addPageTabItem = vi.fn();
    const app = {
      flowEngine: {
        registerModelLoaders,
        flowSettings: {
          registerDynamicFlowSourceProvider,
        },
        getAction: vi.fn(() => undefined),
        registerActions: vi.fn(),
      },
      pluginSettingsManager: {
        addMenuItem,
        addPageTabItem,
      },
      i18n: {
        t: (key: string) => key,
      },
    };
    const plugin = new PluginUiTemplatesClientV2({}, app as never);

    try {
      await plugin.load();

      expect(registerModelLoaders).toHaveBeenCalledWith(
        expect.objectContaining({
          ReferenceBlockModel: expect.objectContaining({ loader: expect.any(Function) }),
          ReferenceFormGridModel: expect.objectContaining({ loader: expect.any(Function) }),
          SubModelTemplateImporterModel: expect.objectContaining({ loader: expect.any(Function) }),
        }),
      );
      expect(registerDynamicFlowSourceProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'ui-templates-reference-block',
          visible: expect.any(Function),
          getSources: expect.any(Function),
        }),
      );
      expect(addMenuItem).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'ui-templates',
          title: 'UI templates',
          icon: 'ProfileOutlined',
          aclSnippet: 'pm.ui-templates.templates',
          showTabs: true,
        }),
      );
      expect(addPageTabItem).toHaveBeenCalledWith(
        expect.objectContaining({
          menuKey: 'ui-templates',
          key: 'block',
          title: 'Block templates',
          aclSnippet: 'pm.ui-templates.templates',
        }),
      );
      expect(addPageTabItem).toHaveBeenCalledWith(
        expect.objectContaining({
          menuKey: 'ui-templates',
          key: 'popup',
          title: 'Popup templates',
          aclSnippet: 'pm.ui-templates.templates',
        }),
      );

      const engine = new FlowEngine();
      const block = new BlockModel({ uid: 'plugin-test-block', use: 'BlockModel', flowEngine: engine });
      const menuItems = await BlockModel.getExtraMenuItems(block, t);
      expect(menuItems.filter((item) => item.key === 'block-reference:convert-to-template')).toHaveLength(1);
    } finally {
      registerMenuExtensions()();
    }
  });
});
