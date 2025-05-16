/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Bench } from 'tinybench';

import { getApp } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

async function run(app, fn, args) {
  const db = app.db;
  const WorkflowRepo = db.getCollection('workflows').repository;

  const workflow = await WorkflowRepo.create({
    values: {
      enabled: true,
      sync: true,
      type: 'syncTrigger',
    },
  });

  await fn({ app, workflow }, args);
}

async function loopEcho({ app, workflow }, target) {
  const plugin = app.pm.get(Plugin) as Plugin;

  const loopNode = await workflow.createNode({
    type: 'loop',
    config: {
      target,
    },
  });

  await workflow.createNode({
    type: 'echo',
    upstreamId: loopNode.id,
    branchIndex: 0,
  });

  await plugin.trigger(workflow, {});
}

async function loopQuery({ app, workflow }, target) {
  const plugin = app.pm.get(Plugin) as Plugin;

  const loopNode = await workflow.createNode({
    type: 'loop',
    config: {
      target,
    },
  });

  await workflow.createNode({
    type: 'query',
    config: {
      collection: 'posts',
      params: {
        filterByTk: Math.ceil(Math.random() * 1000),
      },
    },
    upstreamId: loopNode.id,
    branchIndex: 0,
  });

  await plugin.trigger(workflow, {});
}

async function loopCreate({ app, workflow }, target) {
  const plugin = app.pm.get(Plugin) as Plugin;

  const loopNode = await workflow.createNode({
    type: 'loop',
    config: {
      target,
    },
  });

  await workflow.createNode({
    type: 'create',
    config: {
      collection: 'posts',
      params: {
        values: {},
      },
    },
    upstreamId: loopNode.id,
    branchIndex: 0,
  });

  await plugin.trigger(workflow, {});
}

async function benchmark() {
  const app = await getApp({
    plugins: ['workflow-loop'],
  });

  const PostModel = app.db.getCollection('posts').model;
  await PostModel.bulkCreate(Array.from({ length: 1000 }, (_, i) => ({ title: `test-${i}` })));

  const bench = new Bench()
    .add('1 node', async () => {
      await run(app, loopEcho, 0);
    })
    .add('20 nodes: loop 10 echos', async () => {
      await run(app, loopEcho, 10);
    })
    .add('200 nodes: loop 100 echos', async () => {
      await run(app, loopEcho, 100);
    })
    .add('20 nodes: loop 10 queries', async () => {
      await run(app, loopQuery, 10);
    })
    .add('200 nodes: loop 100 queries', async () => {
      await run(app, loopQuery, 100);
    })
    .add('20 nodes: loop 10 creates', async () => {
      await run(app, loopCreate, 10);
    })
    .add('200 nodes: loop 100 creates', async () => {
      await run(app, loopCreate, 100);
    });
  await bench.run();

  await app.cleanDb();
  await app.destroy();

  console.table(bench.table());
}

benchmark()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
