/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Application } from '@nocobase/server';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('json-query > model', () => {
  let app: Application;
  let CategoryRepo;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });

    CategoryRepo = app.db.getCollection('categories').repository;

    const WorkflowModel = app.db.getModel('workflows');
    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'categories',
        appends: ['posts'],
      },
    });
  });

  afterEach(() => app.destroy());

  describe('defined', () => {
    it('only path', async () => {
      const n1 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jsonata',
          source: '{{$context.data}}',
          expression: `posts[published=true]`,
          model: [{ path: 'title' }],
        },
      });

      const data = await CategoryRepo.create({
        values: {
          title: 'c1',
          posts: [
            { title: 'tech', published: true },
            { title: 'self' },
            { title: 'life', published: true },
            { title: 'school', published: true },
          ],
        },
      });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j1] = await e1.getJobs();
      expect(j1.status).toBe(JOB_STATUS.RESOLVED);
      expect(j1.result).toEqual([{ title: 'tech' }, { title: 'life' }, { title: 'school' }]);
    });
  });
});
