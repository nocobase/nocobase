/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import WorkflowPlugin, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import { ARRAY_KEY_IN_PATH } from '../../contants';
import Plugin from '..';

describe('workflow > instructions > JSONVariableMapping', () => {
  let app: MockServer;
  let db: Database;
  let workflow;
  let engine: WorkflowPlugin;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', Plugin],
    });

    db = app.db;
    engine = app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const WorkflowModel = db.getCollection('workflows').model;
    workflow = await WorkflowModel.create({
      type: 'syncTrigger',
      enabled: true,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('JSONVariableMapping', () => {
    it('input constant null', async () => {
      const n1 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: null,
          variables: [
            {
              key: '0edqwx52zrm',
              path: 'nnn',
              name: 'nnn',
              paths: ['nnn'],
            },
            {
              key: 'tt0ejs22ifv',
              path: 'nnn.ccc',
              name: 'ccc',
              paths: ['nnn', 'ccc'],
            },
          ],
        },
      });

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.FAILED);
      const [JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.FAILED);
      expect(JSONJob.result['0edqwx52zrm']).toBe(undefined);
      expect(JSONJob.result.tt0ejs22ifv).toBe(undefined);
    });

    it('input upstream null', async () => {
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable: null,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          variables: [
            {
              key: '0edqwx52zrm',
              path: 'nnn',
              name: 'nnn',
              paths: ['nnn'],
            },
            {
              key: 'tt0ejs22ifv',
              path: 'nnn.ccc',
              name: 'ccc',
              paths: ['nnn', 'ccc'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.FAILED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.FAILED);
      expect(JSONJob.result['0edqwx52zrm']).toBe(undefined);
      expect(JSONJob.result.tt0ejs22ifv).toBe(undefined);
    });
    it('when get a missing property', async () => {
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable: {
            nnn: 'mm',
            ccc: {
              vv: ['234'],
              dd: {
                aa: '34',
              },
              'dd.aa': '56',
            },
            cc: [
              {
                dd: 90,
              },
            ],
          },
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          variables: [
            {
              key: '0edqwx52zrm',
              path: 'nnn',
              name: 'nnn',
              paths: ['nnn'],
            },
            {
              key: 'tt0ejs22ifv',
              path: 'nnn.ccc',
              name: 'ccc',
              paths: ['nnn', 'ccc'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result['0edqwx52zrm']).toBe('mm');
      expect(JSONJob.result.tt0ejs22ifv).toBe(undefined);
    });
    it('simply object', async () => {
      const variable = {
        a: {
          b: [
            {
              c: '123',
              d: '789',
            },
            {
              c: '456',
              d: '789',
            },
          ],
          e: '990',
        },
      };
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: false,
          variables: [
            {
              key: 'fyi5vddy158',
              path: 'a',
              name: 'a',
              paths: ['a'],
            },
            {
              key: 'zx7fpr7ivnc',
              path: 'a.b',
              name: 'b',
              paths: ['a', 'b'],
            },
            {
              key: 'xp7vz3zn5m5',
              path: 'a.b._.c',
              name: 'c',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, 'c'],
            },
            {
              key: '13tkz3k8gza',
              path: 'a.b._.d',
              name: 'd',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, 'd'],
            },
            {
              key: 'ag17oe8vdkp',
              path: 'a.e',
              name: 'e',
              paths: ['a', 'e'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.fyi5vddy158).toStrictEqual(variable.a);
      expect(JSONJob.result.zx7fpr7ivnc).toStrictEqual(variable.a.b);
      expect(JSONJob.result.xp7vz3zn5m5).toStrictEqual(['123', '456']);
      expect(JSONJob.result['13tkz3k8gza']).toStrictEqual(['789', '789']);
      expect(JSONJob.result.ag17oe8vdkp).toStrictEqual(variable.a.e);
    });
    it('complex object', async () => {
      const variable = {
        a: {
          b: [
            {
              c: '123',
              d: '789',
            },
            {
              c: '456',
            },
            ['ddd'],
            [
              {
                c: 'aaa',
              },
              {
                c: 'ccc',
                f: 'bbb',
              },
              ['eee'],
            ],
          ],
          e: '990',
        },
      };
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: false,
          variables: [
            {
              key: 'i26b3oeyhws',
              path: 'a',
              name: 'a',
              paths: ['a'],
            },
            {
              key: '5l3cyjhd3cw',
              path: 'a.b',
              name: 'b',
              paths: ['a', 'b'],
            },
            {
              key: 'ixbjyi5sag8',
              path: 'a.b._.c',
              name: 'c',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, 'c'],
            },
            {
              key: '70f7itjkpa3',
              path: 'a.b._.d',
              name: 'd',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, 'd'],
            },
            {
              key: 'dyuzrn90htb',
              path: 'a.b._._.c',
              name: 'c',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_PATH, 'c'],
            },
            {
              key: 'pgmst3g3n7u',
              path: 'a.b._._.f',
              name: 'f',
              paths: ['a', 'b', ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_PATH, 'f'],
            },
            {
              key: 'qg8jdkz7ijf',
              path: 'a.e',
              name: 'e',
              paths: ['a', 'e'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.i26b3oeyhws).toStrictEqual(variable.a);
      expect(JSONJob.result['5l3cyjhd3cw']).toStrictEqual(variable.a.b);
      expect(JSONJob.result.ixbjyi5sag8).toStrictEqual(['123', '456']);
      expect(JSONJob.result['70f7itjkpa3']).toStrictEqual(['789']);
      expect(JSONJob.result.dyuzrn90htb).toStrictEqual(['aaa', 'ccc']);
      expect(JSONJob.result.pgmst3g3n7u).toStrictEqual(['bbb']);
      expect(JSONJob.result.qg8jdkz7ijf).toStrictEqual(variable.a.e);
    });
    it('simply object with parsing array', async () => {
      const variable = {
        a: {
          b: [
            {
              c: '123',
              d: '789',
            },
            {
              c: '456',
              d: '789',
            },
          ],
          e: '990',
        },
      };
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: true,
          variables: [
            {
              key: 'how1xjtzir2',
              path: 'a',
              name: 'a',
              paths: ['a'],
            },
            {
              key: 'a8qwxljrk10',
              path: 'a.b',
              name: 'b',
              paths: ['a', 'b'],
            },
            {
              key: 'i5ik9yephiv',
              path: 'a.b.0',
              name: '0',
              paths: ['a', 'b', '0'],
            },
            {
              key: 'syfwoqylka3',
              path: 'a.b.0.c',
              name: 'c',
              paths: ['a', 'b', '0', 'c'],
            },
            {
              key: 'vimsq8jxcq3',
              path: 'a.b.0.d',
              name: 'd',
              paths: ['a', 'b', '0', 'd'],
            },
            {
              key: 'y9knpmnj83y',
              path: 'a.e',
              name: 'e',
              paths: ['a', 'e'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.how1xjtzir2).toStrictEqual(variable.a);
      expect(JSONJob.result.a8qwxljrk10).toStrictEqual(variable.a.b);
      expect(JSONJob.result.i5ik9yephiv).toStrictEqual(variable.a.b[0]);
      expect(JSONJob.result.syfwoqylka3).toStrictEqual(variable.a.b[0].c);
      expect(JSONJob.result.vimsq8jxcq3).toStrictEqual(variable.a.b[0].d);
      expect(JSONJob.result.y9knpmnj83y).toStrictEqual(variable.a.e);
    });
    it('complex object with parsing array', async () => {
      const variable = {
        a: {
          b: [
            {
              c: '123',
              d: '789',
            },
            {
              c: '456',
            },
            ['ddd'],
            [
              {
                c: 'aaa',
              },
              {
                c: 'ccc',
                f: 'bbb',
              },
              ['eee'],
            ],
          ],
          e: '990',
        },
      };
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: false,
          variables: [
            {
              key: 'ybnwccbk0xm',
              path: 'a',
              name: 'a',
              paths: ['a'],
            },
            {
              key: 'trd0fluu4km',
              path: 'a.b',
              name: 'b',
              paths: ['a', 'b'],
            },
            {
              key: '1ujt2ev7qzv',
              path: 'a.b.0',
              name: '0',
              paths: ['a', 'b', '0'],
            },
            {
              key: 'eq72xyzu23x',
              path: 'a.b.0.c',
              name: 'c',
              paths: ['a', 'b', '0', 'c'],
            },
            {
              key: '8jgtkcxmwe5',
              path: 'a.b.0.d',
              name: 'd',
              paths: ['a', 'b', '0', 'd'],
            },
            {
              key: 'g80ivg5werx',
              path: 'a.b.1',
              name: '1',
              paths: ['a', 'b', '1'],
            },
            {
              key: 'bjtdmh5jp7e',
              path: 'a.b.1.c',
              name: 'c',
              paths: ['a', 'b', '1', 'c'],
            },
            {
              key: '1zr4tjc4a86',
              path: 'a.b.2',
              name: '2',
              paths: ['a', 'b', '2'],
            },
            {
              key: 'w9calgq8u4c',
              path: 'a.b.2.0',
              name: '0',
              paths: ['a', 'b', '2', '0'],
            },
            {
              key: '2vqjqb4tv9w',
              path: 'a.b.3',
              name: '3',
              paths: ['a', 'b', '3'],
            },
            {
              key: '9wz9yt39tv0',
              path: 'a.b.3.0',
              name: '0',
              paths: ['a', 'b', '3', '0'],
            },
            {
              key: 'ud4bzkb45e9',
              path: 'a.b.3.0.c',
              name: 'c',
              paths: ['a', 'b', '3', '0', 'c'],
            },
            {
              key: 'g99723yhy3y',
              path: 'a.b.3.0.f',
              name: 'f',
              paths: ['a', 'b', '3', '0', 'f'],
            },
            {
              key: '6g9ohdjb9sa',
              path: 'a.b.3.1',
              name: '1',
              paths: ['a', 'b', '3', '1'],
            },
            {
              key: 'vpyus93sy4i',
              path: 'a.b.3.1.c',
              name: 'c',
              paths: ['a', 'b', '3', '1', 'c'],
            },
            {
              key: 'brk9o6fomqq',
              path: 'a.b.3.2',
              name: '2',
              paths: ['a', 'b', '3', '2'],
            },
            {
              key: '42rpapgwt7r',
              path: 'a.b.3.2.0',
              name: '0',
              paths: ['a', 'b', '3', '2', '0'],
            },
            {
              key: 'w8rwscfyqes',
              path: 'a.e',
              name: 'e',
              paths: ['a', 'e'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.ybnwccbk0xm).toStrictEqual(variable.a);
      expect(JSONJob.result.trd0fluu4km).toStrictEqual(variable.a.b);
      expect(JSONJob.result['1ujt2ev7qzv']).toStrictEqual(variable.a.b[0]);
      expect(JSONJob.result.eq72xyzu23x).toStrictEqual((variable.a.b[0] as { c: string }).c);
      expect(JSONJob.result['8jgtkcxmwe5']).toStrictEqual((variable.a.b[0] as { d: string }).d);
      expect(JSONJob.result.g80ivg5werx).toStrictEqual(variable.a.b[1]);
      expect(JSONJob.result.bjtdmh5jp7e).toStrictEqual((variable.a.b[1] as { c: string }).c);
      expect(JSONJob.result['1zr4tjc4a86']).toStrictEqual(variable.a.b[2]);
      expect(JSONJob.result.w9calgq8u4c).toStrictEqual(variable.a.b[2][0]);
      expect(JSONJob.result['2vqjqb4tv9w']).toStrictEqual(variable.a.b[3]);
      expect(JSONJob.result['9wz9yt39tv0']).toStrictEqual(variable.a.b[3][0]);
      expect(JSONJob.result['ud4bzkb45e9']).toStrictEqual(variable.a.b[3][0].c);
      expect(JSONJob.result['g99723yhy3y']).toStrictEqual(variable.a.b[3][0].f);
      expect(JSONJob.result['6g9ohdjb9sa']).toStrictEqual(variable.a.b[3][1]);
      expect(JSONJob.result['vpyus93sy4i']).toStrictEqual(variable.a.b[3][1].c);
      expect(JSONJob.result['brk9o6fomqq']).toStrictEqual(variable.a.b[3][2]);
      expect(JSONJob.result['42rpapgwt7r']).toStrictEqual(variable.a.b[3][2][0]);
      expect(JSONJob.result.w8rwscfyqes).toStrictEqual(variable.a.e);
    });
    it('array without parsing array', async () => {
      const variable = [
        {
          c: '123',
          d: '789',
        },
        {
          c: '555',
          f: '789',
        },
        [
          {
            c: '123',
            d: '789',
          },
          {
            e: 'mmm',
            d: '233',
          },
        ],
      ];
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: false,
          variables: [
            {
              key: 'oux62i3oo90',
              path: '[].c',
              name: 'c',
              paths: [ARRAY_KEY_IN_PATH, 'c'],
            },
            {
              key: 'lm3d1epxnju',
              path: '[].d',
              name: 'd',
              paths: [ARRAY_KEY_IN_PATH, 'd'],
            },
            {
              key: 'wbhdqjr2kiv',
              path: '[].f',
              name: 'f',
              paths: [ARRAY_KEY_IN_PATH, 'f'],
            },
            {
              key: 's0se9cdbhbm',
              path: '[][].c',
              name: 'c',
              paths: [ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_PATH, 'c'],
            },
            {
              key: 'oggqdj4nrdq',
              path: '[][].d',
              name: 'd',
              paths: [ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_PATH, 'd'],
            },
            {
              key: 'f2vt60okjwv',
              path: '[][].e',
              name: 'e',
              paths: [ARRAY_KEY_IN_PATH, ARRAY_KEY_IN_PATH, 'e'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.oux62i3oo90).toStrictEqual(['123', '555']);
      expect(JSONJob.result.lm3d1epxnju).toStrictEqual(['789']);
      expect(JSONJob.result.wbhdqjr2kiv).toStrictEqual(['789']);
      expect(JSONJob.result.s0se9cdbhbm).toStrictEqual(['123']);
      expect(JSONJob.result.oggqdj4nrdq).toStrictEqual(['789', '233']);
      expect(JSONJob.result.f2vt60okjwv).toStrictEqual(['mmm']);
    });
    it('array with parsing array', async () => {
      const variable = [
        {
          c: '123',
          d: '789',
        },
        {
          c: '555',
          f: '789',
        },
        [
          {
            c: '123',
            d: '789',
          },
          {
            e: 'mmm',
            d: '233',
          },
        ],
      ];
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable,
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          parseArray: true,
          variables: [
            {
              key: 'umqau983xrp',
              path: '[].0',
              name: '0',
              paths: [ARRAY_KEY_IN_PATH, '0'],
            },
            {
              key: 'ph4sne0rzag',
              path: '[].0.c',
              name: 'c',
              paths: [ARRAY_KEY_IN_PATH, '0', 'c'],
            },
            {
              key: '1838l1wqykf',
              path: '[].0.d',
              name: 'd',
              paths: [ARRAY_KEY_IN_PATH, '0', 'd'],
            },
            {
              key: 'c1kjugwk88r',
              path: '[].1',
              name: '1',
              paths: [ARRAY_KEY_IN_PATH, '1'],
            },
            {
              key: '1mx1pws62k2',
              path: '[].1.c',
              name: 'c',
              paths: [ARRAY_KEY_IN_PATH, '1', 'c'],
            },
            {
              key: '76fouy3vbpl',
              path: '[].1.f',
              name: 'f',
              paths: [ARRAY_KEY_IN_PATH, '1', 'f'],
            },
            {
              key: 'xo9fol3qyhl',
              path: '[].2',
              name: '2',
              paths: [ARRAY_KEY_IN_PATH, '2'],
            },
            {
              key: 'ylqc55ufmq1',
              path: '[].2.0',
              name: '0',
              paths: [ARRAY_KEY_IN_PATH, '2', '0'],
            },
            {
              key: 'e2m0xvylq0b',
              path: '[].2.0.c',
              name: 'c',
              paths: [ARRAY_KEY_IN_PATH, '2', '0', 'c'],
            },
            {
              key: 'mmuk5wu8hoc',
              path: '[].2.0.d',
              name: 'd',
              paths: [ARRAY_KEY_IN_PATH, '2', '0', 'd'],
            },
            {
              key: 'tcbghieuroc',
              path: '[].2.1',
              name: '1',
              paths: [ARRAY_KEY_IN_PATH, '2', '1'],
            },
            {
              key: '0qf1k5q846w',
              path: '[].2.1.e',
              name: 'e',
              paths: [ARRAY_KEY_IN_PATH, '2', '1', 'e'],
            },
            {
              key: '4bo6b9ujea7',
              path: '[].2.1.d',
              name: 'd',
              paths: [ARRAY_KEY_IN_PATH, '2', '1', 'd'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.umqau983xrp).toStrictEqual(variable[0]);
      expect(JSONJob.result.ph4sne0rzag).toStrictEqual((variable[0] as { c: string }).c);
      expect(JSONJob.result['1838l1wqykf']).toStrictEqual((variable[0] as { d: string }).d);
      expect(JSONJob.result.c1kjugwk88r).toStrictEqual(variable[1]);
      expect(JSONJob.result['1mx1pws62k2']).toStrictEqual((variable[1] as { c: string }).c);
      expect(JSONJob.result['76fouy3vbpl']).toStrictEqual((variable[1] as { f: string }).f);
      expect(JSONJob.result.xo9fol3qyhl).toStrictEqual(variable[2]);
      expect(JSONJob.result['ylqc55ufmq1']).toStrictEqual(variable[2][0]);
      expect(JSONJob.result['e2m0xvylq0b']).toStrictEqual((variable[2][0] as { c: string }).c);
      expect(JSONJob.result['mmuk5wu8hoc']).toStrictEqual((variable[2][0] as { d: string }).d);
      expect(JSONJob.result['tcbghieuroc']).toStrictEqual(variable[2][1]);
      expect(JSONJob.result['0qf1k5q846w']).toStrictEqual((variable[2][1] as { e: string }).e);
      expect(JSONJob.result['4bo6b9ujea7']).toStrictEqual((variable[2][1] as { d: string }).d);
    });
    it('should get diffirent ccc.dd.aa value', async () => {
      const n1 = await workflow.createNode({
        type: 'echoVariable',
        config: {
          variable: {
            nnn: 'mm',
            ccc: {
              vv: ['234'],
              dd: {
                aa: '34',
              },
              'dd.aa': '56',
            },
            cc: [
              {
                dd: 90,
              },
            ],
          },
        },
      });
      const n2 = await workflow.createNode({
        type: 'json-variable-mapping',
        config: {
          dataSource: `{{$jobsMapByNodeKey.${n1.key}}}`,
          variables: [
            {
              key: '0edqwx52zrm',
              path: 'nnn',
              name: 'nnn',
              paths: ['nnn'],
            },
            {
              key: 'tt0ejs22ifv',
              path: 'ccc',
              name: 'ccc',
              paths: ['ccc'],
            },
            {
              key: '5rd3lmspo6r',
              path: 'ccc.vv',
              name: 'vv',
              paths: ['ccc', 'vv'],
            },
            {
              key: '5uabriqaygo',
              path: 'ccc.vv.0',
              name: '0',
              paths: ['ccc', 'vv', '0'],
            },
            {
              key: 'fkdaf4xnrxk',
              path: 'ccc.dd',
              name: 'dd',
              paths: ['ccc', 'dd'],
            },
            {
              key: 'g3ke50zz0le',
              path: 'ccc.dd.aa',
              name: 'aa',
              paths: ['ccc', 'dd', 'aa'],
            },
            {
              key: 'oehvon6n5oq',
              path: 'ccc.dd.aa',
              name: 'dd.aa',
              paths: ['ccc', 'dd.aa'],
            },
            {
              key: '706tm65d098',
              path: 'cc',
              name: 'cc',
              paths: ['cc'],
            },
            {
              key: '64n31brnzfm',
              path: 'cc.0',
              name: '0',
              paths: ['cc', '0'],
            },
            {
              key: '59rugsclpyz',
              path: 'cc.0.dd',
              name: 'dd',
              paths: ['cc', '0', 'dd'],
            },
          ],
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      await engine.trigger(workflow, {});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [requestJob, JSONJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(JSONJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSONJob.result.g3ke50zz0le).toBe('34');
      expect(JSONJob.result.oehvon6n5oq).toBe('56');
    });
  });
});
