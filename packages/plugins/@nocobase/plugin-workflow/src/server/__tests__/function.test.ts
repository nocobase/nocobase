/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const last2days = dayjs().tz(timezone).subtract(2, 'day');
const yesterday = dayjs().tz(timezone).subtract(1, 'day');
const today = dayjs().tz(timezone);
const tomorrow = dayjs().tz(timezone).add(1, 'day');
const theDayAfterTomorrow = dayjs().tz(timezone).add(2, 'day');

const lastWeek = dayjs().tz(timezone).subtract(1, 'week');
const lastWeekFirstDay = lastWeek.clone().startOf('week');
const lastWeekLastDay = lastWeek.clone().endOf('week');
const thisWeekFirstDay = today.clone().tz(timezone).startOf('week');
const thisWeekLastDay = today.clone().endOf('week');
const nextWeek = dayjs().tz(timezone).add(1, 'week');
const nextWeekFirstDay = nextWeek.clone().startOf('week');
const nextWeekLastDay = nextWeek.clone().endOf('week');

const lastMonth = dayjs().tz(timezone).subtract(1, 'month');
const lastMonthFirstDay = lastMonth.clone().startOf('month');
const lastMonthLastDay = lastMonth.clone().endOf('month');
const thisMonthFirstDay = today.clone().startOf('month');
const thisMonthLastDay = today.clone().endOf('month');
const nextMonth = dayjs().tz(timezone).add(1, 'month');
const nextMonthFirstDay = nextMonth.clone().startOf('month');
const nextMonthLastDay = nextMonth.clone().endOf('month');

const lastQuarter = dayjs().tz(timezone).subtract(1, 'quarter');
const lastQuarterFirstDay = lastQuarter.clone().startOf('quarter');
const lastQuarterLastDay = lastQuarter.clone().endOf('quarter');
const thisQuarterFirstDay = today.clone().startOf('quarter');
const thisQuarterLastDay = today.clone().endOf('quarter');
const nextQuarter = dayjs().tz(timezone).add(1, 'quarter');
const nextQuarterFirstDay = nextQuarter.clone().startOf('quarter');
const nextQuarterLastDay = nextQuarter.clone().endOf('quarter');

const lastYear = dayjs().tz(timezone).subtract(1, 'year');
const lastYearFirstDay = lastYear.clone().startOf('year');
const lastYearLastDay = lastYear.clone().endOf('year');
const thisYearFirstDay = today.clone().startOf('year');
const thisYearLastDay = today.clone().endOf('year');
const nextYear = dayjs().tz(timezone).add(1, 'year');
const nextYearFirstDay = nextYear.clone().startOf('year');
const nextYearLastDay = nextYear.clone().endOf('year');

describe('workflow > functions > system variable', () => {
  let app: Application;
  let db: Database;
  let PostCollection;
  let PostRepo;
  let TagModel;
  let CommentRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostCollection = db.getCollection('posts');
    PostRepo = PostCollection.repository;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  describe('system variable should', () => {
    it('filter yesterday record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.yesterday}}' },
                },
              ],
            },
          },
        },
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'yesterday', updatedAt: yesterday.toDate() },
          { title: 'two day ago', updatedAt: last2days.toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter today record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.today}}' },
                },
              ],
            },
          },
        },
      });

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'yesterday', updatedAt: yesterday.toDate() },
          { title: 'today', updatedAt: today.toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(posts[2].title);
    });
    it('filter tomorrow record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.tomorrow}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'yesterday', updatedAt: yesterday.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'tomorrow', updatedAt: tomorrow.toDate() },
          { title: 'the day after tomorrow', updatedAt: theDayAfterTomorrow.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(1);
      expect(job.result[0].title).toBe(posts[3].title);
    });
    it('filter last week record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.lastIsoWeek}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'last week first day', updatedAt: lastWeekFirstDay.toDate() },
          { title: 'last week last day', updatedAt: lastWeekLastDay.toDate() },
          { title: 'last week', updatedAt: lastWeek.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(2);
      expect(job.result[0].title).toBe(posts[3].title);
    });
    it('filter this week record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.thisIsoWeek}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this week first day', updatedAt: thisWeekFirstDay.toDate() },
          { title: 'this week last day', updatedAt: thisWeekLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(2);
      expect(job.result[0].title).toBe(posts[2].title);
    });
    it('filter next week record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.nextIsoWeek}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this week first day', updatedAt: thisWeekFirstDay.toDate() },
          { title: 'next week', updatedAt: nextWeek.toDate() },
          { title: 'next week last day', updatedAt: nextWeekLastDay.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(2);
      expect(job.result[0].title).toBe(posts[2].title);
    });
    it('filter last month record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.lastMonth}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'last month', updatedAt: lastMonth.toDate() },
          { title: 'next month', updatedAt: nextMonth.toDate() },
          { title: 'last month last day', updatedAt: lastMonthLastDay.toDate() },
          { title: 'last month first day', updatedAt: lastMonthFirstDay.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter this month record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.thisMonth}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this month first day', updatedAt: thisMonthFirstDay.toDate() },
          { title: 'next month', updatedAt: nextMonth.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this month last day', updatedAt: thisMonthLastDay.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter next month record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.nextMonth}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next month first day', updatedAt: nextMonthFirstDay.toDate() },
          { title: 'next month', updatedAt: nextMonth.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'next month last day', updatedAt: nextMonthLastDay.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter last quarter record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.lastQuarter}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next month first day', updatedAt: nextMonthFirstDay.toDate() },
          { title: 'next month', updatedAt: nextMonth.toDate() },
          { title: 'next month last day', updatedAt: nextMonthLastDay.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
          { title: 'last quarter first day', updatedAt: lastQuarterFirstDay.toDate() },
          { title: 'last quarter last day', updatedAt: lastQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[4].title);
    });
    it('filter this quarter record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.thisQuarter}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
          { title: 'last quarter first day', updatedAt: lastQuarterFirstDay.toDate() },
          { title: 'last quarter last day', updatedAt: lastQuarterLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this quarter first day', updatedAt: thisQuarterFirstDay.toDate() },
          { title: 'this quarter last day', updatedAt: thisQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[4].title);
    });
    it('filter next quarter record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.nextQuarter}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
          { title: 'next quarter first day', updatedAt: nextQuarterFirstDay.toDate() },
          { title: 'next quarter last day', updatedAt: nextQuarterLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this quarter first day', updatedAt: thisQuarterFirstDay.toDate() },
          { title: 'this quarter last day', updatedAt: thisQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter last year record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.lastYear}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'last year', updatedAt: lastYear.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
          { title: 'last year first day', updatedAt: lastYearFirstDay.toDate() },
          { title: 'last year last day', updatedAt: lastYearLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this quarter first day', updatedAt: thisQuarterFirstDay.toDate() },
          { title: 'this quarter last day', updatedAt: thisQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[0].title);
    });
    it('filter this year record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.thisYear}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'last year', updatedAt: lastYear.toDate() },
          { title: 'this year first day', updatedAt: thisYearFirstDay.toDate() },
          { title: 'this year last day', updatedAt: thisYearLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this quarter first day', updatedAt: thisQuarterFirstDay.toDate() },
          { title: 'this quarter last day', updatedAt: thisQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(5);
      expect(job.result[0].title).toBe(posts[1].title);
    });
    it('filter next year record', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            appends: [],
            page: 1,
            pageSize: 20,
            sort: [],
            filter: {
              $and: [
                {
                  updatedAt: { $dateOn: '{{$system.dateRange.nextYear}}' },
                },
              ],
            },
          },
        },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'last year', updatedAt: lastYear.toDate() },
          { title: 'next year', updatedAt: nextYear.toDate() },
          { title: 'next year first day', updatedAt: nextYearFirstDay.toDate() },
          { title: 'next year last day', updatedAt: nextYearLastDay.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'this quarter first day', updatedAt: thisQuarterFirstDay.toDate() },
          { title: 'this quarter last day', updatedAt: thisQuarterLastDay.toDate() },
        ],
        silent: true,
      });

      await sleep(1500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.length).toBe(3);
      expect(job.result[0].title).toBe(posts[1].title);
    });
  });
});
