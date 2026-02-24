/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Path from 'path';

import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import winston from 'winston';
import { CacheTransport } from '../cache-logger';
import ScriptInstruction from '../ScriptInstruction';

import Plugin from '..';

describe('workflow > instructions > script', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let logger;
  let originalEnv;

  beforeEach(async () => {
    originalEnv = process.env.WORKFLOW_SCRIPT_MODULES;
    const mathjsPath = Path.resolve(process.env.PWD, 'node_modules', 'mathjs');
    const testModulePath = '.' + Path.sep + 'node_modules' + Path.sep + 'mathjs';
    process.env.WORKFLOW_SCRIPT_MODULES = `path,crypto,lodash,dayjs,http,axios,node:timers,node:process,fs,@nocobase/utils,${mathjsPath},${testModulePath}`;

    app = await getApp({
      plugins: [Plugin],
    });

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

    // logger = (app.pm.get(Plugin) as Plugin).createLogger({
    //   transports: ['console'],
    // });
    logger = (app.pm.get(Plugin) as Plugin).createLogger({
      transports: ['console'],
    });
  });

  afterEach(async () => {
    process.env.WORKFLOW_SCRIPT_MODULES = originalEnv;
    return app.destroy();
  });

  describe('syntax', () => {
    it('syntax error', async () => {
      const n1 = await workflow.createNode({
        type: 'script',
        config: {
          arguments: [{ name: 'aaa', value: 6 }],
          content: 'const\nreturn "Hello world!";',
          continue: false,
          timeout: 2,
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post' },
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.ERROR);
      expect(job.result).toBe("Unexpected token 'return'");
    });
  });

  describe('arguments', () => {
    it('should accept variable', async () => {
      const n1 = await workflow.createNode({
        type: 'script',
        config: {
          arguments: [{ name: 'aaa', value: '{{$context.data.title}}' }],
          content: 'return aaa + 90;',
          continue: false,
          timeout: 2,
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post' },
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(job.result).toBe('post90');
    });

    it('arguments types', async () => {
      const n1 = await workflow.createNode({
        type: 'script',
        config: {
          arguments: [
            { name: 'boolean', value: true },
            { name: 'number', value: 1 },
            { name: 'string', value: 'abc' },
            { name: 'date', value: new Date('2024-09-30T16:00:00.000Z') },
            { name: 'array', value: [1, 2, 3] },
            { name: 'object', value: { a: 1, b: 2, c: 3 } },
            { name: 'nil', value: null },
            {
              name: 'mixed',
              value: {
                boolean: true,
                number: 1,
                string: 'abc',
                date: new Date('2024-09-30T16:00:00.000Z'),
                array: [1, 2, 3],
                object: { a: 1, b: 2, c: 3 },
                nil: null,
              },
            },
          ],
          content: `return [
            boolean,
            number,
            string,
            typeof date,
            array.join(''),
            object.a,
            nil,
            mixed,
          ];`,
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post' },
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(job.result).toEqual([
        true,
        1,
        'abc',
        'string',
        '123',
        1,
        null,
        {
          boolean: true,
          number: 1,
          string: 'abc',
          date: '2024-09-30T16:00:00.000Z',
          array: [1, 2, 3],
          object: { a: 1, b: 2, c: 3 },
          nil: null,
        },
      ]);
    });
  });

  describe('logger', () => {
    it('multiple logs', async () => {
      const transport = new CacheTransport();
      const logger = winston.createLogger({
        transports: [transport],
      });
      const script = `
        const dayjs = require('dayjs');
        console.log(123);
        console.log('123mmmm123mmmm123mmmm123mmmm123mmmm123mmmm123mmmm123mmmm123mmmm123mmmm');
        console.log({var1: var1});
        console.log(true);
        console.log(dayjs());

        return "Hello world!";
      `;
      const args = { var1: 'string' };
      const result = await ScriptInstruction.run(script, args, { logger });
      await sleep(500);
      const log = transport.getLogs();

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe('Hello world!');
      expect(log).toBeInstanceOf(Array);
      expect(log.length).toBe(5);
      expect(log[0]).toBe('123\n');
      expect(log[2]).toBe("{ var1: 'string' }\n");
      expect(log[3]).toBe('true\n');
    });
  });

  describe('promise and timeout', () => {
    it('should fail when Promise is reject', async () => {
      const script = `
        return Promise.reject(new Error('fail'));
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.ERROR);
      expect(result.result).toBe('fail');
    });

    it('should use setTimeout', async () => {
      const script = `
        const { setTimeout } = require('node:timers');
        return new Promise((res) => {
          setTimeout(() => {
            res(90);
          }, 80);
        });
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe(90);
    });

    it('should use await', async () => {
      const script = `
        const a = await Promise.resolve(90);
        const b = await Promise.resolve(90);

        return a + b;
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe(180);
    });
  });

  describe('require module', () => {
    it('can require nodejs internal module', async () => {
      const script = `
        const fs = require('fs');

        return new Promise((res, rej) => {
          fs.stat('./', (error, stats) => {
            res(stats);
          });
        });
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('can require npm module: lodash', async () => {
      const script = `
        const lodash = require('lodash');

        return lodash.countBy([6.1, 4.2, 6.3], Math.floor);
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(JSON.stringify(result.result)).toBe('{"4":1,"6":2}');
    });

    it('can require npm module: axios', async () => {
      const script = `
        const axios = require('axios');
        const result = await axios.get('https://docs-cn.nocobase.com/api/cache/cache/');
        return result.status;
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe(200);
    });

    it.skip('can require nocobase module: @nocobase/utils', async () => {
      const script = `
        const { uid } = require('@nocobase/utils');
        return uid();
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBeTypeOf('string');
    });

    it.skip('can require module based on relative local path', async () => {
      const script = `
        const Path = require('path');
        const math = require('.' + Path.sep + 'node_modules' + Path.sep + 'mathjs');
        return math.evaluate('1+1');
      `;
      const result = await ScriptInstruction.run(script, [], { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe(2);
    });

    it('can require module based on absolute local path', async () => {
      const script = `
        const process = require('node:process');
        const Path = require('path');
        const math = require(Path.resolve(process.env.PWD, 'node_modules', 'mathjs'));
        return math.evaluate('1+1');
      `;
      const result = await ScriptInstruction.run(script, [], { logger });

      expect(result.status).toBe(JOB_STATUS.RESOLVED);
      expect(result.result).toBe(2);
    });

    it('can not require module based on absolute local path when not configured', async () => {
      const script = `
        const process = require('node:process');
        const Path = require('path');
        const { ABS } = require(Path.resolve(process.env.PWD, 'node_modules', '@formulajs', 'formulajs'));
        return ABS(-1);
      `;
      const result = await ScriptInstruction.run(script, [], { logger });

      expect(result.status).toBe(JOB_STATUS.ERROR);
    });

    it('shoule failed when execution timed out', async () => {
      const script = `
        const { setTimeout } = require('node:timers');
        const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
        await sleep(1000);
        return 123;
      `;
      const args = [];
      const result = await ScriptInstruction.run(script, args, { timeout: 100, logger });

      expect(result.status).toBe(JOB_STATUS.ERROR);
      expect(result.result).toBe('Script execution timed out after 100ms');
    });
  });
});
