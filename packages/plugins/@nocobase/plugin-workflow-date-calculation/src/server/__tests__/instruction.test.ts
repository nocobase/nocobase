/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { MockServer } from '@nocobase/test';
import dayjs from 'dayjs';
import { functions } from '../dateFunction';

import Plugin from '..';

describe('workflow-date-calculation', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let CategoryRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'acl', 'data-source-manager', Plugin],
    });

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
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

  describe('node in workflow', () => {
    it('invalid input', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: 'wrong date',
          inputType: 'date',
          steps: [
            {
              function: 'diff',
              arguments: {
                date: '2024-07-27T15:16:14.865Z',
                unit: 'day',
                isAbs: false,
                round: 0,
              },
            },
          ],
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post', updatedAt: new Date('2024-07-30T15:16:14.865Z') },
        silent: true,
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.ERROR);
      expect(job.result).toBe('Invalid input');
    });

    it('invalid input', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: 'not number type',
          inputType: 'number',
          steps: [
            {
              function: 'transDuration',
              arguments: {
                unitAfter: 'minute',
                unitBefore: 'day',
                round: 0,
              },
            },
          ],
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post', updatedAt: new Date('2024-07-30T15:16:14.865Z') },
        silent: true,
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.ERROR);
      expect(job.result).toBe('Invalid input');
    });

    it('throw error will end the calculation pipeline', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: '2024-08-05T16:00:00.000Z',
          inputType: 'date',
          steps: [
            {
              function: 'diff',
              arguments: { date: 'not a date', isAbs: false, round: false, unit: 'day' },
            },
            {
              function: 'diff',
              arguments: {
                date: '2024-07-27T15:16:14.865Z',
                unit: 'day',
                isAbs: false,
                round: 0,
              },
            },
          ],
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post', updatedAt: new Date('2024-07-30T15:16:14.865Z') },
        silent: true,
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.ERROR);
      expect(job.result).toBe('Error: Diff date [not a date] is not a valid date');
    });

    it('should accept variable input', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: '{{$context.data.updatedAt}}',
          inputType: 'date',
          steps: [
            {
              function: 'diff',
              arguments: {
                date: '2024-07-27T15:16:14.865Z',
                unit: 'day',
                isAbs: false,
                round: 0,
              },
            },
          ],
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post', updatedAt: new Date('2024-07-30T15:16:14.865Z') },
        silent: true,
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(job.result).toBe(3);
    });
    it('should accept date constant input', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: '2024-08-05T16:00:00.000Z',
          inputType: 'date',
          steps: [
            {
              function: 'diff',
              arguments: {
                date: '2024-07-27T15:16:14.865Z',
                unit: 'day',
                isAbs: false,
                round: 0,
              },
            },
          ],
        },
      });

      const posts = await PostRepo.create({
        values: { title: 'post', updatedAt: new Date('2023-07-30T15:16:14.865Z') },
        silent: true,
      });

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(job.result).toBe(9);
    });
  });

  describe('date calculate functions', () => {
    it('add', async () => {
      const calculate = functions.add;
      const args_millisecond = { number: 1, unit: 'millisecond' };
      const args_second = { number: 1, unit: 'second' };
      const args_minute = { number: 1, unit: 'minute' };
      const args_hour = { number: 1, unit: 'hour' };
      const args_day = { number: 1, unit: 'day' };
      const args_week = { number: 1, unit: 'week' };
      const args_month = { number: 1, unit: 'month' };
      const args_quarter = { number: 1, unit: 'quarter' };
      const args_year = { number: 1, unit: 'year' };

      const args_wrong_type1 = { number: 2, unit: 'wrong' };
      const args_wrong_type2 = { number: 'number', unit: 'wrong' };
      const args_negative = { number: -1, unit: 'wrong' };

      const args_invalid_number1 = { number: '', unit: 'day' };
      const args_invalid_number2 = { number: false, unit: 'day' };
      const args_invalid_number3 = { number: true, unit: 'day' };
      const args_invalid_number4 = { number: 'number', unit: 'day' };

      const day = dayjs('2024-7-15 23:59:59:999');

      const result1 = calculate(day, args_millisecond);
      expect(result1.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:000');

      const result2 = calculate(day, args_second);
      expect(result2.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:999');

      const result3 = calculate(day, args_minute);
      expect(result3.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:59:999');

      const result4 = calculate(day, args_hour);
      expect(result4.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:59:59:999');

      const result5 = calculate(day, args_day);
      expect(result5.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 23:59:59:999');

      const result6 = calculate(day, args_week);
      expect(result6.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-22 23:59:59:999');

      const result7 = calculate(day, args_month);
      expect(result7.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-08-15 23:59:59:999');

      const result8 = calculate(day, args_quarter);
      expect(result8.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-10-15 23:59:59:999');

      const result9 = calculate(day, args_year);
      expect(result9.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2025-07-15 23:59:59:999');

      // 错误的类型会兼容成毫秒
      const result10 = calculate(day, args_wrong_type1);
      expect(result10.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:001');

      const result11 = calculate(day, args_wrong_type2);
      expect(result11.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('Invalid Date');

      const result12 = calculate(day, args_negative);
      expect(result12.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:998');

      const result13 = calculate(day, args_invalid_number1);
      expect(result13.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:999');

      // false不变
      const result14 = calculate(day, args_invalid_number2);
      expect(result14.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:999');

      // true加1
      const result15 = calculate(day, args_invalid_number3);
      expect(result15.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 23:59:59:999');

      const result16 = calculate(day, args_invalid_number4);
      expect(result16.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('Invalid Date');
    });

    it('subtract', async () => {
      const calculate = functions.subtract;
      const args_millisecond = { number: 1, unit: 'millisecond' };
      const args_second = { number: 1, unit: 'second' };
      const args_minute = { number: 1, unit: 'minute' };
      const args_hour = { number: 1, unit: 'hour' };
      const args_day = { number: 1, unit: 'day' };
      const args_week = { number: 1, unit: 'week' };
      const args_month = { number: 1, unit: 'month' };
      const args_quarter = { number: 1, unit: 'quarter' };
      const args_year = { number: 1, unit: 'year' };

      const args_wrong_type1 = { number: 2, unit: 'wrong' };
      const args_wrong_type2 = { number: 'number', unit: 'wrong' };
      const args_negative = { number: -1, unit: 'wrong' };

      const args_invalid_number1 = { number: '', unit: 'day' };
      const args_invalid_number2 = { number: false, unit: 'day' };
      const args_invalid_number3 = { number: true, unit: 'day' };
      const args_invalid_number4 = { number: 'number', unit: 'day' };

      const day = dayjs('2024-7-16 00:00:00:000');

      const result1 = calculate(day, args_millisecond);
      expect(result1.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:999');

      const result2 = calculate(day, args_second);
      expect(result2.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:000');

      const result3 = calculate(day, args_minute);
      expect(result3.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:00:000');

      const result4 = calculate(day, args_hour);
      expect(result4.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:00:00:000');

      const result5 = calculate(day, args_day);
      expect(result5.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 00:00:00:000');

      const result6 = calculate(day, args_week);
      expect(result6.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-09 00:00:00:000');

      const result7 = calculate(day, args_month);
      expect(result7.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-06-16 00:00:00:000');

      const result8 = calculate(day, args_quarter);
      expect(result8.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-04-16 00:00:00:000');

      const result9 = calculate(day, args_year);
      expect(result9.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2023-07-16 00:00:00:000');

      // 错误的类型会兼容成毫秒
      const result10 = calculate(day, args_wrong_type1);
      expect(result10.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:998');

      const result11 = calculate(day, args_wrong_type2);
      expect(result11.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('Invalid Date');

      const result12 = calculate(day, args_negative);
      expect(result12.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:001');

      const result13 = calculate(day, args_invalid_number1);
      expect(result13.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:000');

      // false不变
      const result14 = calculate(day, args_invalid_number2);
      expect(result14.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-16 00:00:00:000');

      // true减1
      const result15 = calculate(day, args_invalid_number3);
      expect(result15.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 00:00:00:000');

      const result16 = calculate(day, args_invalid_number4);
      expect(result16.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('Invalid Date');
    });

    it('diff', async () => {
      const calculate = functions.diff;
      const args_millisecond = { date: '2024-7-14 23:59:59:999', isAbs: false, round: false, unit: 'millisecond' };
      const args_second = { date: '2024-7-14 23:59:59', isAbs: false, round: false, unit: 'second' };
      const args_minute = { date: '2024-7-14 23:59:15', isAbs: false, round: false, unit: 'minute' };
      const args_hour = { date: '2024-7-14 23:59:15', isAbs: false, round: false, unit: 'hour' };
      const args_day = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'day' };
      const args_week = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'week' };
      const args_month1 = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'month' };
      const args_month2 = { date: '2024-8-16 6:00:00', isAbs: false, round: false, unit: 'month' };
      const args_quarter1 = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'quarter' };
      const args_quarter2 = { date: '2024-10-15 12:00:00', isAbs: false, round: false, unit: 'quarter' };
      const args_year1 = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'year' };
      const args_year2 = { date: '2025-7-15 12:00:00', isAbs: false, round: false, unit: 'year' };

      const args_abs1 = { date: '2024-7-16 6:00:00', isAbs: false, round: false, unit: 'day' };
      const args_abs2 = { date: '2024-7-16 6:00:00', isAbs: true, round: false, unit: 'day' };

      const args_round1 = { date: '2024-7-16 6:00:00', isAbs: false, round: false, unit: 'day' };
      const args_round2 = { date: '2024-7-16 6:00:00', isAbs: false, round: -1, unit: 'day' };
      const args_round3 = { date: '2024-7-16 6:00:00', isAbs: false, round: 0, unit: 'day' };
      const args_round4 = { date: '2024-7-16 6:00:00', isAbs: false, round: 1, unit: 'day' };

      const args_round5 = { date: '2024-7-14 6:00:00', isAbs: false, round: false, unit: 'day' };
      const args_round6 = { date: '2024-7-14 6:00:00', isAbs: false, round: -1, unit: 'day' };
      const args_round7 = { date: '2024-7-14 6:00:00', isAbs: false, round: 0, unit: 'day' };
      const args_round8 = { date: '2024-7-14 6:00:00', isAbs: false, round: 1, unit: 'day' };

      const args_invlid_day = { date: 'not a date', isAbs: false, round: false, unit: 'day' };
      const args_invalid_round1 = { date: '2024-7-16 6:00:00', isAbs: false, round: 'not a round', unit: 'day' };
      const args_invalid_round2 = { date: '2024-7-16 6:00:00', isAbs: false, round: '', unit: 'day' };
      const args_invalid_unit1 = { date: '2024-7-16 6:00:00', isAbs: false, round: false, unit: '' };
      const args_invalid_unit2 = { date: '2024-7-16 6:00:00', isAbs: false, round: false, unit: 'not a unit' };

      const day = dayjs('2024-7-16 00:00:00:000');

      const result1 = calculate(day, args_millisecond);
      expect(result1).toBe(86400001);

      // 如果是999毫秒结果是86401
      const result2 = calculate(day, args_second);
      expect(result2).toBe(86401);

      const result3 = calculate(day, args_minute);
      expect(result3).toBe(1440.75);

      const result4 = calculate(day, args_hour);
      expect(result4).toBe(24.0125);

      const result5 = calculate(day, args_day);
      expect(result5).toBe(1.75);

      const result6 = calculate(day, args_week);
      expect(result6).toBe(0.25);

      // 按一个月30天算
      const result7 = calculate(day, args_month1);
      expect(result7).toBe(0.058333333333333334);

      // 按一个月31天算
      const result8 = calculate(day, args_month2);
      expect(result8).toBe(-1.0080645161290323);

      // 按一个季度90天算
      const result9 = calculate(day, args_quarter1);
      expect(result9).toBe(0.019444444444444445);

      // 按一个季度92-93天算
      const result10 = calculate(day, args_quarter2);
      expect(result10).toBe(-0.9944444444444445);

      // 按一年360天计算
      const result11 = calculate(day, args_year1);
      expect(result11).toBe(0.004861111111111111);

      // 按一年365-366天计算
      const result12 = calculate(day, args_year2);
      expect(result12).toBe(-0.998611111111111);

      const result13 = calculate(day, args_abs1);
      expect(result13).toBe(-0.25);

      const result14 = calculate(day, args_abs2);
      expect(result14).toBe(0.25);

      // 正负号会对小数取值有影响，因此需要提示先取正负号再取小数
      const result15 = calculate(day, args_round1);
      expect(result15).toBe(-0.25);

      const result16 = calculate(day, args_round2);
      expect(result16).toBe(-1);

      const result17 = calculate(day, args_round3);
      expect(result17).toBe(-0);

      const result18 = calculate(day, args_round4);
      expect(result18).toBe(-0);

      const result19 = calculate(day, args_round5);
      expect(result19).toBe(1.75);

      const result20 = calculate(day, args_round6);
      expect(result20).toBe(1);

      const result21 = calculate(day, args_round7);
      expect(result21).toBe(2);

      const result22 = calculate(day, args_round8);
      expect(result22).toBe(2);

      expect(() => calculate(day, args_invlid_day)).toThrowError('Diff date [not a date] is not a valid date');

      // round除了0，-1,1外任何值都看成和false效果一致
      const result24 = calculate(day, args_invalid_round1);
      expect(result24).toBe(-0.25);

      const result25 = calculate(day, args_invalid_round2);
      expect(result25).toBe(-0.25);

      // 错误的unit类型会兼容成毫秒
      const result26 = calculate(day, args_invalid_unit1);
      expect(result26).toBe(-21600000);

      const result27 = calculate(day, args_invalid_unit2);
      expect(result27).toBe(-21600000);
    });

    it('get', async () => {
      const calculate = functions.get;
      const args_millisecond = { unit: 'millisecond' };
      const args_second = { unit: 'second' };
      const args_minute = { unit: 'minute' };
      const args_hour = { unit: 'hour' };
      const args_day = { unit: 'day' };
      const args_week = { unit: 'week' };
      const args_month = { unit: 'month' };
      const args_quarter = { unit: 'quarter' };
      const args_year = { unit: 'year' };

      const args_invalid_unit1 = { unit: '' };
      const args_invalid_unit2 = { unit: 'not a unit' };

      const day = dayjs('2024-7-15 23:59:50:999');
      const result1 = calculate(day, args_millisecond);
      expect(result1).toBe(999);

      const result2 = calculate(day, args_second);
      expect(result2).toBe(50);

      const result3 = calculate(day, args_minute);
      expect(result3).toBe(59);

      const result4 = calculate(day, args_hour);
      expect(result4).toBe(23);

      const result5 = calculate(day, args_day);
      expect(result5).toBe(15);

      const result6 = calculate(day, args_week);
      expect(result6).toBe(1);

      const result7 = calculate(day, args_month);
      expect(result7).toBe(7);

      const result8 = calculate(day, args_quarter);
      expect(result8).toBe(3);

      const result9 = calculate(day, args_year);
      expect(result9).toBe(2024);

      const result10 = calculate(day, args_invalid_unit1);
      expect(result10).toBe(999);

      const result11 = calculate(day, args_invalid_unit2);
      expect(result11).toBe(999);
    });

    it('startOfTime', async () => {
      const calculate = functions.startOfTime;
      const args_millisecond = { unit: 'millisecond' };
      const args_second = { unit: 'second' };
      const args_minute = { unit: 'minute' };
      const args_hour = { unit: 'hour' };
      const args_day = { unit: 'day' };
      const args_week = { unit: 'week' };
      const args_month = { unit: 'month' };
      const args_quarter = { unit: 'quarter' };
      const args_year = { unit: 'year' };

      const args_invaild_unit1 = { unit: '' };
      const args_invaild_unit2 = { unit: 'not a unit' };

      const day = dayjs('2024-7-15 14:32:25:897');

      // 毫秒最开始的无效
      const result1 = calculate(day, args_millisecond);
      expect(result1.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');

      const result2 = calculate(day, args_second);
      expect(result2.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:000');

      const result3 = calculate(day, args_minute);
      expect(result3.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:00:000');

      const result4 = calculate(day, args_hour);
      expect(result4.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:00:00:000');

      const result5 = calculate(day, args_day);
      expect(result5.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 00:00:00:000');

      // 周一为一个星期的第一天
      const result6 = calculate(day, args_week);
      expect(result6.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 00:00:00:000');

      const result7 = calculate(day, args_month);
      expect(result7.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-01 00:00:00:000');

      const result8 = calculate(day, args_quarter);
      expect(result8.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-01 00:00:00:000');

      const result9 = calculate(day, args_year);
      expect(result9.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-01-01 00:00:00:000');

      const result10 = calculate(day, args_invaild_unit1);
      expect(result10.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');

      const result11 = calculate(day, args_invaild_unit2);
      expect(result11.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');
    });

    it('endOfTime', async () => {
      const calculate = functions.endOfTime;
      const args_millisecond = { unit: 'millisecond' };
      const args_second = { unit: 'second' };
      const args_minute = { unit: 'minute' };
      const args_hour = { unit: 'hour' };
      const args_day = { unit: 'day' };
      const args_week = { unit: 'week' };
      const args_month = { unit: 'month' };
      const args_quarter = { unit: 'quarter' };
      const args_year = { unit: 'year' };

      const args_invaild_unit1 = { unit: '' };
      const args_invaild_unit2 = { unit: 'not a unit' };

      const day = dayjs('2024-7-15 14:32:25:897');

      // 毫秒无效
      const result1 = calculate(day, args_millisecond);
      expect(result1.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');

      const result2 = calculate(day, args_second);
      expect(result2.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:999');

      const result3 = calculate(day, args_minute);
      expect(result3.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:59:999');

      const result4 = calculate(day, args_hour);
      expect(result4.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:59:59:999');

      const result5 = calculate(day, args_day);
      expect(result5.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 23:59:59:999');

      // 周日为一个星期的最后一天
      const result6 = calculate(day, args_week);
      expect(result6.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-21 23:59:59:999');

      const result7 = calculate(day, args_month);
      expect(result7.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-31 23:59:59:999');

      const result8 = calculate(day, args_quarter);
      expect(result8.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-09-30 23:59:59:999');

      const result9 = calculate(day, args_year);
      expect(result9.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-12-31 23:59:59:999');

      const result10 = calculate(day, args_invaild_unit1);
      expect(result10.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');

      const result11 = calculate(day, args_invaild_unit2);
      expect(result11.format('YYYY-MM-DD HH:mm:ss:SSS')).toBe('2024-07-15 14:32:25:897');
    });

    it('isLeapYear', async () => {
      const calculate = functions.isLeapYear;
      const args = {};

      const result1 = calculate(dayjs('2024-7-15'), args);
      expect(result1).toBe(true);
      const result2 = calculate(dayjs('2023-7-15'), args);
      expect(result2).toBe(false);
    });

    it('format', async () => {
      const calculate = functions.format;
      const day = dayjs('2024-7-15 22:07:30:876');

      const args1 = { format: 'YYYY/MM/DD H:m:s:SSS' };
      const result1 = calculate(day, args1);
      expect(result1).toBe('2024/07/15 22:7:30:876');

      const Z = dayjs().format('Z');

      const args2 = { format: '[today is ]YY/MM/DD HH:mm:ss SSS Z' };
      const result2 = calculate(day, args2);
      expect(result2).toBe(`today is 24/07/15 22:07:30 876 ${Z}`);

      const args3 = { format: '' };
      const result3 = calculate(day, args3);
      expect(result3).toBe(`2024-07-15T22:07:30${Z}`);

      const args4 = { format: 'wrong string' };
      const result4 = calculate(day, args4);
      expect(result4).toBe('29rong 30tring');

      const args5 = { format: 123 };
      expect(() => calculate(day, args5)).toThrowError('[123] is not a string');

      const args6 = { format: false };
      expect(() => calculate(day, args6)).toThrowError('[false] is not a string');

      const args7 = { format: true };
      expect(() => calculate(day, args7)).toThrowError('[true] is not a string');
    });

    it('transDuration', async () => {
      const calculate = functions.transDuration;

      const tests = [
        {
          value: 'year',
          inputValue: 2,
          transTo: [
            { value: 'year', expectValue: 2 },
            { value: 'month', expectValue: 24 },
            { value: 'week', expectValue: 104.28571428571429 },
            { value: 'day', expectValue: 730 },
            { value: 'hour', expectValue: 17520 },
            { value: 'minute', expectValue: 1051200 },
            { value: 'second', expectValue: 63072000 },
            { value: 'millisecond', expectValue: 63072000000 },
          ],
        },
        {
          value: 'month',
          inputValue: 9,
          transTo: [
            { value: 'year', expectValue: 0.75 },
            { value: 'month', expectValue: 9 },
            // 一个月在30-31天之间
            { value: 'week', expectValue: 39.107142857142854 },
            // 无法理解9个月怎么会有0.75天呢。。
            { value: 'day', expectValue: 273.75 },
            { value: 'hour', expectValue: 6570 },
            { value: 'minute', expectValue: 394200 },
            { value: 'second', expectValue: 23652000 },
            { value: 'millisecond', expectValue: 23652000000 },
          ],
        },
        {
          value: 'month',
          inputValue: 9,
          transTo: [
            { value: 'year', round: false, expectValue: 0.75 },
            { value: 'year', round: -1, expectValue: 0 },
            { value: 'year', round: 0, expectValue: 1 },
            { value: 'year', round: 1, expectValue: 1 },
            // 一个月在30-31天之间
            { value: 'week', round: false, expectValue: 39.107142857142854 },
            { value: 'week', round: -1, expectValue: 39 },
            { value: 'week', round: 0, expectValue: 39 },
            { value: 'week', round: 1, expectValue: 40 },

            { value: '', round: false, throwMessage: '[] is not a unit string' },
            { value: 'not a unit', round: false, throwMessage: '[not a unit] is not a unit string' },
            { value: 123, round: false, throwMessage: '[123] is not a unit string' },
            { value: false, round: false, throwMessage: '[false] is not a unit string' },

            { value: 'year', round: '', expectValue: 0.75 },
            { value: 'year', round: 'not a round', expectValue: 0.75 },
          ],
        },
        {
          value: 'day',
          inputValue: 45,
          transTo: [
            { value: 'year', expectValue: 0.1232876712328767 },
            // 一个月在30-31天之间
            { value: 'month', expectValue: 1.4794520547945205 },
            { value: 'week', expectValue: 6.428571428571429 },
            { value: 'day', expectValue: 45 },
            { value: 'hour', expectValue: 1080 },
            { value: 'minute', expectValue: 64800 },
            { value: 'second', expectValue: 3888000 },
            { value: 'millisecond', expectValue: 3888000000 },
          ],
        },
        {
          value: 'hour',
          inputValue: 360,
          transTo: [
            // 四舍五入会把小数约没
            { value: 'year', expectValue: 0.0410958904109589 },
            { value: 'year', round: 0, expectValue: 0 },
            // 一个月在30-31天之间
            { value: 'month', expectValue: 0.4931506849315068 },
            { value: 'week', expectValue: 2.142857142857143 },
            { value: 'day', expectValue: 15 },
            { value: 'hour', expectValue: 360 },
            { value: 'minute', expectValue: 21600 },
            { value: 'second', expectValue: 1296000 },
            { value: 'millisecond', expectValue: 1296000000 },
          ],
        },
        {
          value: 'minute',
          inputValue: 21600,
          transTo: [
            { value: 'year', expectValue: 0.0410958904109589 },
            { value: 'month', expectValue: 0.4931506849315068 },
            { value: 'week', expectValue: 2.142857142857143 },
            { value: 'day', expectValue: 15 },
            { value: 'hour', expectValue: 360 },
            { value: 'minute', expectValue: 21600 },
            { value: 'second', expectValue: 1296000 },
            { value: 'millisecond', expectValue: 1296000000 },
          ],
        },
        {
          value: 'minute',
          inputValue: -21600,
          transTo: [
            { value: 'year', expectValue: -0.0410958904109589 },
            { value: 'month', expectValue: -0.4931506849315068 },
            { value: 'week', expectValue: -2.142857142857143 },
            { value: 'day', expectValue: -15 },
            { value: 'hour', expectValue: -360 },
            { value: 'minute', expectValue: -21600 },
            { value: 'second', expectValue: -1296000 },
            { value: 'millisecond', expectValue: -1296000000 },
          ],
        },
        {
          value: 'second',
          inputValue: 1296000,
          transTo: [
            { value: 'year', expectValue: 0.0410958904109589 },
            { value: 'month', expectValue: 0.4931506849315068 },
            { value: 'week', expectValue: 2.142857142857143 },
            { value: 'day', expectValue: 15 },
            { value: 'hour', expectValue: 360 },
            { value: 'minute', expectValue: 21600 },
            { value: 'second', expectValue: 1296000 },
            { value: 'millisecond', expectValue: 1296000000 },
          ],
        },
        {
          value: 'millisecond',
          inputValue: 1296000000,
          transTo: [
            { value: 'year', expectValue: 0.0410958904109589 },
            { value: 'month', expectValue: 0.4931506849315068 },
            { value: 'week', expectValue: 2.142857142857143 },
            { value: 'day', expectValue: 15 },
            { value: 'hour', expectValue: 360 },
            { value: 'minute', expectValue: 21600 },
            { value: 'second', expectValue: 1296000 },
            { value: 'millisecond', expectValue: 1296000000 },
          ],
        },
        // trans不支持quarter
        // { value: 'quarter', index: 2, transformNumber: 3 },
      ];
      function runTest({ unitBefore, unitAfter, inputValue, expectValue, round = false, throwMessage }: any) {
        console.log(
          `test: unitBefore: ${unitBefore}, unitAfter: ${unitAfter}, input: ${inputValue}, expectValue: ${expectValue}`,
        );
        const args = { unitBefore: unitBefore, unitAfter: unitAfter, round };

        if (throwMessage) {
          expect(() => calculate(inputValue, args)).toThrowError(throwMessage);
        } else {
          const result = calculate(inputValue, args);
          expect(result).toBe(expectValue);
        }
      }

      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const unitBefore = test.value;
        for (let j = 0; j < test.transTo.length; j++) {
          const transItem: any = test.transTo[j];
          const unitAfter = transItem.value;

          runTest({
            unitBefore,
            unitAfter,
            inputValue: test.inputValue,
            expectValue: transItem.expectValue,
            round: transItem.round,
            throwMessage: transItem.throwMessage,
          });
        }
      }
    });

    it('toTimestamp', async () => {
      const calculate = functions.toTimestamp;
      expect(calculate).toBeInstanceOf(Function);

      expect(calculate(dayjs('2024-07-15T22:07:30.23Z'), { unit: 'millisecond' })).toBe(1721081250230);
      expect(calculate(dayjs('2024-07-15T22:07:30.23Z'), {})).toBe(1721081250);
    });

    it('tsToDate', async () => {
      const calculate = functions.tsToDate;
      expect(calculate).toBeInstanceOf(Function);

      expect(calculate(1721081250, {}).toISOString()).toBe('2024-07-15T22:07:30.000Z');
      expect(calculate(1721081250230, { unit: 'millisecond' }).toISOString()).toBe('2024-07-15T22:07:30.230Z');
    });

    it('changeTimezone', async () => {
      const { changeTimezone } = functions;
      expect(changeTimezone).toBeInstanceOf(Function);

      expect(
        changeTimezone(dayjs('2024-07-15T22:07:30.23Z'), { timezone: 'Asia/Shanghai' }).format('YYYY-MM-DD HH:mm:ss'),
      ).toBe('2024-07-16 06:07:30');
    });
  });

  describe('test action', () => {
    it('test with static values', async () => {
      const n1 = await workflow.createNode({
        type: 'dateCalculation',
        config: {
          input: '2024-07-27T15:16:14.865Z',
          inputType: 'date',
          steps: [
            {
              function: 'diff',
              arguments: {
                date: '2024-07-27T15:16:14.865Z',
                unit: 'day',
                isAbs: false,
                round: 0,
              },
            },
          ],
        },
      });
      const UserRepo = db.getCollection('users').repository;
      const root = await UserRepo.findOne({});
      const rootAgent = await app.agent().login(root);
      const res1 = await rootAgent.resource('flow_nodes').test({
        values: {
          type: 'dateCalculation',
          config: {
            input: '2024-07-27T15:16:14.865Z',
            inputType: 'date',
            steps: [
              {
                function: 'diff',
                arguments: {
                  date: '2024-07-27T15:16:14.865Z',
                  unit: 'day',
                  isAbs: false,
                  round: 0,
                },
              },
            ],
          },
        },
      });
      expect(res1.status).toBe(200);
      expect(res1.body.data.status).toBe(JOB_STATUS.RESOLVED);
      expect(res1.body.data.result).toBe(0);
    });
  });
});
