/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import FlowModelRepository from '../../repository';
import Migration from '../../migrations/20260508000000-remove-flow-model-options-runtime-uid';
import { createFlowEngineMockServer } from '../test-utils';

describe('remove flow model options runtime uid migration', () => {
  let app: MockServer;
  let repository: FlowModelRepository;

  beforeEach(async () => {
    app = await createFlowEngineMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('removes only top-level options.uid values copied from the row uid', async () => {
    await repository.create({
      values: {
        uid: 'node1',
        name: 'node1',
        options: {
          uid: 'node1',
          use: 'MarkdownBlockModel',
          props: {
            content: 'runtime uid should be removed',
          },
        },
      },
      context: {
        disableInsertHook: true,
      },
    });
    await repository.create({
      values: {
        uid: 'node2',
        name: 'node2',
        options: {
          uid: 'external-template-node',
          use: 'MarkdownBlockModel',
          props: {
            content: 'foreign uid should stay',
          },
        },
      },
      context: {
        disableInsertHook: true,
      },
    });

    const migration = new Migration({
      db: app.db,
      app,
    } as any);
    await migration.up();

    const node1 = await repository.model.findByPk('node1');
    const node2 = await repository.model.findByPk('node2');

    expect(node1?.get('options')).toEqual({
      use: 'MarkdownBlockModel',
      props: {
        content: 'runtime uid should be removed',
      },
    });
    expect(node2?.get('options')).toMatchObject({
      uid: 'external-template-node',
      use: 'MarkdownBlockModel',
      props: {
        content: 'foreign uid should stay',
      },
    });
  });
});
