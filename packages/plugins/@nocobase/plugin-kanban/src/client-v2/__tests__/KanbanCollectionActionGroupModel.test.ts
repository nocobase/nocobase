/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { KanbanCollectionActionGroupModel } from '../models/KanbanCollectionActionGroupModel';

describe('KanbanCollectionActionGroupModel', () => {
  test('includes registered AIEmployeeActionModel in kanban collection actions', async () => {
    class AIEmployeeActionModel extends ActionModel {
      static scene = ActionSceneEnum.all;

      static async defineChildren(ctx: any) {
        const aiEmployees = await ctx.aiConfigRepository.getAIEmployees();

        return aiEmployees.map((aiEmployee: any) => ({
          key: aiEmployee.username,
          createModelOptions: {
            use: 'AIEmployeeButtonModel',
          },
        }));
      }
    }

    AIEmployeeActionModel.define({
      label: 'AI employees',
      sort: 8000,
    });

    const engine = new FlowEngine();
    engine.registerModels({ KanbanCollectionActionGroupModel, AIEmployeeActionModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    if (!ds) {
      throw new Error('main data source not found');
    }
    ds.addCollection({
      name: 'posts',
      filterTargetKey: 'id',
      availableActions: ['create'],
      fields: [{ name: 'id', type: 'integer', interface: 'number' }],
    });

    const ctx = {
      engine,
      dataSourceManager: engine.dataSourceManager,
      model: { uid: 'kanban-1' },
      aiConfigRepository: {
        getAIEmployees: vi.fn().mockResolvedValue([{ username: 'alice', nickname: 'Alice' }]),
      },
      collection: ds.getCollection('posts'),
    } as any;

    const items = await KanbanCollectionActionGroupModel.defineChildren(ctx);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      key: 'AIEmployeeActionModel',
      useModel: 'AIEmployeeActionModel',
      sort: 8000,
    });
    expect(typeof items[0].children).toBe('function');
  });
});
