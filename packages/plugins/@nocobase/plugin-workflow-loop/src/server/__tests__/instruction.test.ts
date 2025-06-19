/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';
import { EXIT } from '../../constants';

describe('workflow > instructions > loop', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });
    plugin = app.pm.get('workflow');

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      sync: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  describe('branch', () => {
    it('no branch just pass', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toEqual({ looped: 0 });
    });

    it('should exit when branch meets error', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n3);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
      expect(jobs[0].result).toEqual({ looped: 0 });
      expect(jobs[1].status).toBe(JOB_STATUS.ERROR);
    });
  });

  describe('config', () => {
    describe('target', () => {
      it('no target just pass', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 0 });
      });

      it('null target just pass', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: null,
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 0 });
      });

      it('empty array just pass', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: [],
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 0 });
      });

      it('null value in array will not be passed', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: [null],
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
        expect(jobs.length).toBe(3);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 1 });
      });

      it('target is number, cycle number times', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2.5,
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(4);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
      });

      it('target is no array, set as an array', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: {},
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(3);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 1 });
      });

      it('multiple targets', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: [1, 2],
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(4);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
        expect(jobs.filter((j) => j.nodeId === n2.id).length).toBe(2);
      });
    });

    describe.skip('startIndex', () => {
      it('startIndex as 0', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
          },
        });

        const n2 = await workflow.createNode({
          type: 'echoVariable',
          config: {
            variable: '{{$scopes.' + n1.key + '.item}}',
          },
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echoVariable',
          config: {
            variable: '{{$scopes.' + n1.key + '.index}}',
          },
          upstreamId: n2.id,
        });

        await n2.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(5);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
        expect(jobs[1].result).toBe(0);
        expect(jobs[2].result).toBe(0);
        expect(jobs[3].result).toBe(1);
        expect(jobs[4].result).toBe(1);
      });

      it('startIndex as 1', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            startIndex: 1,
          },
        });

        const n2 = await workflow.createNode({
          type: 'echoVariable',
          config: {
            variable: `{{$scopes.${n1.key}.item}}`,
          },
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echoVariable',
          config: {
            variable: `{{$scopes.${n1.key}.index}}`,
          },
          upstreamId: n2.id,
        });

        await n2.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(5);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
        expect(jobs[1].result).toBe(1);
        expect(jobs[2].result).toBe(1);
        expect(jobs[3].result).toBe(2);
        expect(jobs[4].result).toBe(2);
      });
    });

    describe('condition', () => {
      it('empty condition', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            condition: {
              calculation: {},
            },
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(3);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
      });

      it('condition engine basic before each: true with loop variable', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });
        await n1.update({
          config: {
            target: 2,
            condition: {
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [`{{$scopes.${n1.key}.item}}`, 0],
                    },
                    {
                      calculator: 'equal',
                      operands: [`{{$scopes.${n1.key}.index}}`, 0],
                    },
                  ],
                },
              },
            },
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 1, broken: true });
      });

      it('condition engine basic after each: true with loop variable', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });
        await n1.update({
          config: {
            target: 2,
            condition: {
              checkpoint: 1,
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [`{{$scopes.${n1.key}.item}}`, 0],
                    },
                    {
                      calculator: 'equal',
                      operands: [`{{$scopes.${n1.key}.index}}`, 0],
                    },
                  ],
                },
              },
            },
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 1, broken: true });
      });

      it('condition engine basic before each: first false', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });
        await n1.update({
          config: {
            target: 2,
            condition: {
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [1, 0],
                    },
                  ],
                },
              },
            },
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(1);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 0, broken: true });
      });

      it('condition engine basic after each: first false', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });
        await n1.update({
          config: {
            target: 2,
            condition: {
              checkpoint: 1,
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [1, 0],
                    },
                  ],
                },
              },
            },
          },
        });

        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 1, broken: true });
      });

      it('continueOnFalse as true', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            condition: {
              continueOnFalse: true,
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [1, 0],
                    },
                  ],
                },
              },
            },
          },
        });
        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
      });

      it('continueOnFalse as true, second false', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
        });
        await n1.update({
          config: {
            target: 2,
            condition: {
              continueOnFalse: true,
              calculation: {
                group: {
                  type: 'and',
                  calculations: [
                    {
                      calculator: 'equal',
                      operands: [1, '{{$scopes.' + n1.key + '.item}}'],
                    },
                  ],
                },
              },
            },
          },
        });
        const n2 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
      });
    });

    describe('exit', () => {
      it('exit not configured (legacy)', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
          },
        });

        const n2 = await workflow.createNode({
          type: 'error',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
        expect(jobs[0].result).toEqual({ looped: 0 });
      });

      it('exit as failed', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            exit: EXIT.RETURN,
          },
        });

        const n2 = await workflow.createNode({
          type: 'error',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(2);
        expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
        expect(jobs[0].result).toEqual({ looped: 0 });
      });

      it('exit as break', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            exit: EXIT.BREAK,
          },
        });

        const n2 = await workflow.createNode({
          type: 'error',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(3);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 0, broken: true });
      });

      it('exit as continue', async () => {
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            exit: EXIT.CONTINUE,
          },
        });

        const n2 = await workflow.createNode({
          type: 'error',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const n3 = await workflow.createNode({
          type: 'echo',
          upstreamId: n1.id,
        });

        await n1.setDownstream(n3);

        const post = await PostRepo.create({ values: { title: 't1' } });

        const [execution] = await workflow.getExecutions();
        expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
        const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

        expect(jobs.length).toBe(4);
        expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
        expect(jobs[0].result).toEqual({ looped: 2 });
      });

      it('exit as continue with async node inside', async () => {
        await workflow.update({
          sync: false,
        });
        const n1 = await workflow.createNode({
          type: 'loop',
          config: {
            target: 2,
            exit: EXIT.CONTINUE,
          },
        });

        const n2 = await workflow.createNode({
          type: 'pending',
          upstreamId: n1.id,
          branchIndex: 0,
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        await sleep(500);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
        const j1s = await e1.getJobs({ order: [['id', 'ASC']] });

        expect(j1s.length).toBe(2);

        j1s[1].set('status', JOB_STATUS.RESOLVED);
        plugin.resume(j1s[1]);

        await sleep(500);

        const [e2] = await workflow.getExecutions();
        expect(e2.status).toBe(EXECUTION_STATUS.STARTED);
        const j2s = await e2.getJobs({ order: [['id', 'ASC']] });

        expect(j2s.length).toBe(3);
        expect(j2s[0].result).toEqual({ looped: 1 });
        expect(j2s[1].status).toBe(JOB_STATUS.RESOLVED);
        expect(j2s[2].status).toBe(JOB_STATUS.PENDING);

        j2s[2].set('status', JOB_STATUS.RESOLVED);
        plugin.resume(j2s[2]);

        await sleep(500);

        const [e3] = await workflow.getExecutions();
        expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
        const j3s = await e3.getJobs({ order: [['id', 'ASC']] });

        expect(j3s.length).toBe(3);
        expect(j3s[0].result).toEqual({ looped: 2 });
        expect(j3s[1].status).toBe(JOB_STATUS.RESOLVED);
        expect(j3s[2].status).toBe(JOB_STATUS.RESOLVED);
      });
    });
  });

  describe('scope variable', () => {
    it('item.key', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: '{{$context.data.comments}}',
        },
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$scopes.${n1.id}.item.content}}`,
        },
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          comments: [{ content: 'c1' }, { content: 'c2' }],
        },
      });

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs[1].result).toBe('c1');
      expect(jobs[2].result).toBe('c2');
    });
  });

  describe('mixed', () => {
    it.skip('loop branch contains parallel branches', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'parallel',
        branchIndex: 0,
        upstreamId: n1.id,
        config: {
          mode: 'any',
        },
      });

      const n3 = await workflow.createNode({
        type: 'condition',
        config: {
          rejectOnFalse: true,
          calculation: {
            calculator: '<',
            operands: [`{{$scopes.${n1.id}.item}}`, 1],
          },
        },
        branchIndex: 0,
        upstreamId: n2.id,
      });
      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n3.id,
      });
      await n3.setDownstream(n4);

      const n5 = await workflow.createNode({
        type: 'condition',
        config: {
          rejectOnFalse: true,
          calculation: {
            calculator: '<',
            operands: [`{{$scopes.${n1.id}.item}}`, 1],
          },
        },
        branchIndex: 1,
        upstreamId: n2.id,
      });
      const n6 = await workflow.createNode({
        type: 'echo',
        upstreamId: n5.id,
      });
      await n5.setDownstream(n6);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
      const e1jobs = await e1.getJobs();
      expect(e1jobs.length).toBe(7);
    });

    it('condition contains loop (target as 0)', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
      });

      const n2 = await workflow.createNode({
        type: 'loop',
        branchIndex: 1,
        upstreamId: n1.id,
        config: {
          target: 0,
        },
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n2.id,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
    });

    it('condition contains loop (target as 2)', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
      });

      const n2 = await workflow.createNode({
        type: 'loop',
        branchIndex: 1,
        upstreamId: n1.id,
        config: {
          target: 2,
        },
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n2.id,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(5);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
