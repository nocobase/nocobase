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
import PluginWorkflowServer, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';
import JSONQueryInstruction from '../JSONQueryInstruction';

describe('json-query > engines', () => {
  let app: Application;
  let CategoryRepo;
  let workflow;
  let plugin: PluginWorkflowServer;
  let instruction: JSONQueryInstruction;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });

    plugin = app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
    instruction = plugin.instructions.get('json-query') as JSONQueryInstruction;

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

  describe('jmespath', () => {
    it('variable from trigger context', async () => {
      const n1 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jmespath',
          source: '{{$context.data}}',
          expression: `posts[?published].title | sort(@) | { categoryPosts: join(', ', @)}`,
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
      expect(j1.result).toEqual({ categoryPosts: 'life, school, tech' });
    });

    it('variable from node', async () => {
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable: { data: [1, 2, 3, 4, 5] },
        },
      });

      const n2 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jmespath',
          source: `{{$jobsMapByNodeKey.${n1.key}}}`,
          expression: 'data',
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const data = await CategoryRepo.create({
        values: {
          title: 'c1',
        },
      });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [j1, j2] = await e1.getJobs({ order: [['id', 'asc']] });
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('jsonpathplus', () => {
    it('no wrap with array', () => {
      const query = instruction.engines.get('jsonpathplus');
      const result = query('$', { a: 1 });
      expect(result).toEqual({ a: 1 });
    });

    it('basic syntax', async () => {
      const n1 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jsonpathplus',
          source: '{{$context.data}}',
          expression: `$.posts[?(@.published)].title`,
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
      expect(j1.result).toEqual(['tech', 'life', 'school']);
    });
  });

  describe('jsonata', () => {
    it('basic syntax', async () => {
      const n1 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jsonata',
          source: '{{$context.data}}',
          expression: `posts[published=true].title`,
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
      expect(j1.result).toEqual(['tech', 'life', 'school']);
    });

    it('parse expression first', async () => {
      const n1 = await workflow.createNode({
        type: 'json-query',
        config: {
          engine: 'jsonata',
          source: '{{$context.data}}',
          expression: `posts[published=true][{{$context.data.id}}].title`,
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
      expect(j1.result).toEqual('life');
    });
  });
});
