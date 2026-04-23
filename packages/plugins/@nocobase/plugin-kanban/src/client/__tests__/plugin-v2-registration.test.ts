/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginKanbanClient from '..';
import {
  KanbanBlockModel,
  KanbanCardItemModel,
  KanbanCollectionActionGroupModel,
  KanbanCardViewActionModel,
  KanbanQuickCreateActionModel,
  KanbanGroupOptionsTable,
  KanbanGroupingSelector,
} from '../models';

describe('plugin-kanban v2 registration', () => {
  test('load registers v2 models and grouping components', async () => {
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
      flowSettings: {
        registerComponents: vi.fn(),
      },
    };
    const app = {
      use: vi.fn(),
      addComponents: vi.fn(),
      flowEngine,
      schemaInitializerManager,
      schemaSettingsManager,
    };

    await PluginKanbanClient.prototype.load.call({ app, flowEngine });

    expect(app.addComponents).toHaveBeenCalledWith({ KanbanGroupingSelector, KanbanGroupOptionsTable });
    expect(flowEngine.flowSettings.registerComponents).toHaveBeenCalledWith({
      KanbanGroupingSelector,
      KanbanGroupOptionsTable,
    });
    expect(flowEngine.registerModels).toHaveBeenCalledWith({
      KanbanBlockModel,
      KanbanCardItemModel,
      KanbanCollectionActionGroupModel,
      KanbanCardViewActionModel,
      KanbanQuickCreateActionModel,
    });
    expect(schemaInitializerManager.get).toHaveBeenCalledWith('page:addBlock');
    expect(pageAddBlock.add).toHaveBeenCalledWith(
      'dataBlocks.kanban',
      expect.objectContaining({
        Component: 'KanbanBlockInitializer',
      }),
    );
  });
});
