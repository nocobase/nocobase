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
import { parse } from '@nocobase/utils';
import { dateRangeFns } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let last2days;
let yesterday;
let startOfYesterday;
let endOfYesterday;

let today;
let startOfToday;
let endOfToday;

let tomorrow;
let startOfTomorrow;
let endOfTomorrow;

let theDayAfterTomorrow;

let lastWeek;
let lastWeekFirstDay;
let lastWeekLastDay;
let thisWeekFirstDay;
let thisWeekLastDay;
let nextWeek;
let nextWeekFirstDay;
let nextWeekLastDay;

let lastMonth;
let lastMonthFirstDay;
let lastMonthLastDay;
let thisMonthFirstDay;
let thisMonthLastDay;
let nextMonth;
let nextMonthFirstDay;
let nextMonthLastDay;

let lastQuarter;
let lastQuarterFirstDay;
let lastQuarterLastDay;
let thisQuarterFirstDay;
let thisQuarterLastDay;
let nextQuarter;
let nextQuarterFirstDay;
let nextQuarterLastDay;

let lastYear;
let lastYearFirstDay;
let lastYearLastDay;
let thisYearFirstDay;
let thisYearLastDay;
let nextYear;
let nextYearFirstDay;
let nextYearLastDay;

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
    PostCollection = db.getCollection('posts');
    PostRepo = PostCollection.repository;

    last2days = dayjs().tz(timezone).subtract(2, 'day');

    yesterday = dayjs().tz(timezone).subtract(1, 'day');
    startOfYesterday = yesterday.clone().startOf('day');
    endOfYesterday = yesterday.clone().endOf('day');

    today = dayjs().tz(timezone);
    startOfToday = today.clone().startOf('day');
    endOfToday = today.clone().endOf('day');

    tomorrow = dayjs().tz(timezone).add(1, 'day');
    startOfTomorrow = tomorrow.clone().startOf('day');
    endOfTomorrow = tomorrow.clone().endOf('day');

    theDayAfterTomorrow = dayjs().tz(timezone).add(2, 'day');

    lastWeek = dayjs().tz(timezone).subtract(1, 'week');
    lastWeekFirstDay = lastWeek.clone().startOf('week');
    lastWeekLastDay = lastWeek.clone().endOf('week');
    thisWeekFirstDay = today.clone().tz(timezone).startOf('week');
    thisWeekLastDay = today.clone().endOf('week');
    nextWeek = dayjs().tz(timezone).add(1, 'week');
    nextWeekFirstDay = nextWeek.clone().startOf('week');
    nextWeekLastDay = nextWeek.clone().endOf('week');

    lastMonth = dayjs().tz(timezone).subtract(1, 'month');
    lastMonthFirstDay = lastMonth.clone().startOf('month');
    lastMonthLastDay = lastMonth.clone().endOf('month');
    thisMonthFirstDay = today.clone().startOf('month');
    thisMonthLastDay = today.clone().endOf('month');
    nextMonth = dayjs().tz(timezone).add(1, 'month');
    nextMonthFirstDay = nextMonth.clone().startOf('month');
    nextMonthLastDay = nextMonth.clone().endOf('month');

    lastQuarter = dayjs().tz(timezone).subtract(1, 'quarter');
    lastQuarterFirstDay = lastQuarter.clone().startOf('quarter');
    lastQuarterLastDay = lastQuarter.clone().endOf('quarter');
    thisQuarterFirstDay = today.clone().startOf('quarter');
    thisQuarterLastDay = today.clone().endOf('quarter');
    nextQuarter = dayjs().tz(timezone).add(1, 'quarter');
    nextQuarterFirstDay = nextQuarter.clone().startOf('quarter');
    nextQuarterLastDay = nextQuarter.clone().endOf('quarter');

    lastYear = dayjs().tz(timezone).subtract(1, 'year');
    lastYearFirstDay = lastYear.clone().startOf('year');
    lastYearLastDay = lastYear.clone().endOf('year');
    thisYearFirstDay = today.clone().startOf('year');
    thisYearLastDay = today.clone().endOf('year');
    nextYear = dayjs().tz(timezone).add(1, 'year');
    nextYearFirstDay = nextYear.clone().startOf('year');
    nextYearLastDay = nextYear.clone().endOf('year');
  });

  afterEach(() => app.destroy());

  describe('system variable should', () => {
    it('filter yesterday record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.yesterday}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'yesterday', updatedAt: yesterday.toDate() },
          { title: 'start of yesterday', updatedAt: startOfYesterday.toDate() },
          {
            title: 'the time before start of yesterday 1s',
            updatedAt: startOfYesterday.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of yesterday', updatedAt: endOfYesterday.toDate() },
          { title: 'the time after end of yesterday 1s', updatedAt: endOfYesterday.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter today record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.today}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'today', updatedAt: today.toDate() },
          { title: 'start of today', updatedAt: startOfToday.toDate() },
          { title: 'the time before start of today 1s', updatedAt: startOfToday.clone().subtract(1, 's').toDate() },
          { title: 'end of today', updatedAt: endOfToday.toDate() },
          { title: 'the time after end of today 1s', updatedAt: endOfToday.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter tomorrow record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.tomorrow}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'tomorrow', updatedAt: tomorrow.toDate() },
          { title: 'start of tomorrow', updatedAt: startOfTomorrow.toDate() },
          {
            title: 'the time before start of tomorrow 1s',
            updatedAt: startOfTomorrow.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of tomorrow', updatedAt: endOfTomorrow.toDate() },
          { title: 'the time after end of tomorrow 1s', updatedAt: endOfTomorrow.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter last week record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.lastWeek}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'last week', updatedAt: lastWeek.toDate() },
          { title: 'start of last week', updatedAt: lastWeekFirstDay.toDate() },
          {
            title: 'the time before start of last week 1s',
            updatedAt: lastWeekFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of last week', updatedAt: lastWeekLastDay.toDate() },
          { title: 'the time after end of last week 1s', updatedAt: lastWeekLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter this week record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.thisWeek}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this week', updatedAt: today.toDate() },
          { title: 'start of this week', updatedAt: thisWeekFirstDay.toDate() },
          {
            title: 'the time before start of this week 1s',
            updatedAt: thisWeekFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of this week', updatedAt: thisWeekLastDay.toDate() },
          { title: 'the time after end of this week 1s', updatedAt: thisWeekLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter next week record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.nextWeek}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next week', updatedAt: nextWeek.toDate() },
          { title: 'start of next week', updatedAt: nextWeekFirstDay.toDate() },
          {
            title: 'the time before start of next week 1s',
            updatedAt: nextWeekFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of next week', updatedAt: nextWeekLastDay.toDate() },
          { title: 'the time after end of next week 1s', updatedAt: nextWeekLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter last month record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.lastMonth}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'last month', updatedAt: lastMonth.toDate() },
          { title: 'start of last month', updatedAt: lastMonthFirstDay.toDate() },
          {
            title: 'the time before start of last month 1s',
            updatedAt: lastMonthFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of last month', updatedAt: lastMonthLastDay.toDate() },
          { title: 'the time after end of last month 1s', updatedAt: lastMonthLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter this month record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.thisMonth}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this month', updatedAt: today.toDate() },
          { title: 'start of this month', updatedAt: thisMonthFirstDay.toDate() },
          {
            title: 'the time before start of this month 1s',
            updatedAt: thisMonthFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of this month', updatedAt: thisMonthLastDay.toDate() },
          { title: 'the time after end of this month 1s', updatedAt: thisMonthLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter next month record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.nextMonth}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next month', updatedAt: nextMonth.toDate() },
          { title: 'start of next month', updatedAt: nextMonthFirstDay.toDate() },
          {
            title: 'the time before start of next month 1s',
            updatedAt: nextMonthFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of next month', updatedAt: nextMonthLastDay.toDate() },
          { title: 'the time after end of next month 1s', updatedAt: nextMonthLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter last quarter record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.lastQuarter}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'last quarter', updatedAt: lastQuarter.toDate() },
          { title: 'start of last quarter', updatedAt: lastQuarterFirstDay.toDate() },
          {
            title: 'the time before start of last quarter 1s',
            updatedAt: lastQuarterFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of last quarter', updatedAt: lastQuarterLastDay.toDate() },
          {
            title: 'the time after end of last quarter 1s',
            updatedAt: lastQuarterLastDay.clone().add(1, 's').toDate(),
          },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter this quarter record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.thisQuarter}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this quarter', updatedAt: today.toDate() },
          { title: 'start of this quarter', updatedAt: thisQuarterFirstDay.toDate() },
          {
            title: 'the time before start of this quarter 1s',
            updatedAt: thisQuarterFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of this quarter', updatedAt: thisQuarterLastDay.toDate() },
          {
            title: 'the time after end of this quarter 1s',
            updatedAt: thisQuarterLastDay.clone().add(1, 's').toDate(),
          },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter next quarter record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.nextQuarter}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next quarter', updatedAt: nextQuarter.toDate() },
          { title: 'start of next quarter', updatedAt: nextQuarterFirstDay.toDate() },
          {
            title: 'the time before start of next quarter 1s',
            updatedAt: nextQuarterFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of next quarter', updatedAt: nextQuarterLastDay.toDate() },
          {
            title: 'the time after end of next quarter 1s',
            updatedAt: nextQuarterLastDay.clone().add(1, 's').toDate(),
          },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter last year record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.lastYear}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'last year', updatedAt: lastYear.toDate() },
          { title: 'start of last year', updatedAt: lastYearFirstDay.toDate() },
          {
            title: 'the time before start of last year 1s',
            updatedAt: lastYearFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of last year', updatedAt: lastYearLastDay.toDate() },
          { title: 'the time after end of last year 1s', updatedAt: lastYearLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[0].title);
      expect(result[1].title).toBe(posts[1].title);
      expect(result[2].title).toBe(posts[3].title);
    });
    it('filter this year record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.thisYear}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'this year', updatedAt: today.toDate() },
          { title: 'start of this year', updatedAt: thisYearFirstDay.toDate() },
          {
            title: 'the time before start of this year 1s',
            updatedAt: thisYearFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of this year', updatedAt: thisYearLastDay.toDate() },
          { title: 'the time after end of this year 1s', updatedAt: thisYearLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
    it('filter next year record', async () => {
      const filter = parse({
        updatedAt: {
          $dateOn: '{{$system.dateRange.nextYear}}',
        },
      })({
        $system: { dateRange: dateRangeFns },
      });

      const posts = await PostRepo.createMany({
        records: [
          { title: 'a year ago', updatedAt: lastYear.toDate() },
          { title: 'next year', updatedAt: nextYear.toDate() },
          { title: 'start of next year', updatedAt: nextYearFirstDay.toDate() },
          {
            title: 'the time before start of next year 1s',
            updatedAt: nextYearFirstDay.clone().subtract(1, 's').toDate(),
          },
          { title: 'end of next year', updatedAt: nextYearLastDay.toDate() },
          { title: 'the time after end of next year 1s', updatedAt: nextYearLastDay.clone().add(1, 's').toDate() },
        ],
        silent: true,
      });

      await sleep(500);

      const result = await PostRepo.find({ filter });
      expect(result.length).toBe(3);
      expect(result[0].title).toBe(posts[1].title);
      expect(result[1].title).toBe(posts[2].title);
      expect(result[2].title).toBe(posts[4].title);
    });
  });
});
