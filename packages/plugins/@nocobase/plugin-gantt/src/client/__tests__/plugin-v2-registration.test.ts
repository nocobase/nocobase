/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginGanttClient from '..';
import { describe, expect, test, vi } from 'vitest';
import {
  GanttBlockModel,
  GanttCollectionActionGroupModel,
  GanttExpandCollapseActionModel,
  GanttEventViewActionModel,
} from '../../client-v2/models';

describe('plugin-gantt v2 registration', () => {
  test('load registers v2 models from the v1 client entry', async () => {
    const pageAddBlock = {
      add: vi.fn(),
    };
    const schemaInitializerManager = {
      add: vi.fn(),
      addItem: vi.fn(),
      get: vi.fn(() => pageAddBlock),
    };
    const schemaSettingsManager = {
      add: vi.fn(),
    };
    const flowEngine = {
      registerModels: vi.fn(),
    };
    const i18n = {
      addResources: vi.fn(),
    };
    const app = {
      use: vi.fn(),
      addScopes: vi.fn(),
      i18n,
      flowEngine,
      schemaInitializerManager,
      schemaSettingsManager,
    };

    await PluginGanttClient.prototype.load.call({ app, flowEngine });

    expect(flowEngine.registerModels).toHaveBeenCalledWith({
      GanttBlockModel,
      GanttCollectionActionGroupModel,
      GanttExpandCollapseActionModel,
      GanttEventViewActionModel,
    });
    expect(schemaInitializerManager.get).toHaveBeenCalledWith('page:addBlock');
    expect(pageAddBlock.add).toHaveBeenCalledWith(
      'dataBlocks.gantt',
      expect.objectContaining({
        Component: 'GanttBlockInitializer',
      }),
    );
    expect(i18n.addResources).toHaveBeenCalledWith(
      'zh-CN',
      '@nocobase/plugin-gantt',
      expect.objectContaining({
        Day: '天',
        Hour: '小时',
        'Event popup settings': '任务弹窗设置',
      }),
    );
  });
});
