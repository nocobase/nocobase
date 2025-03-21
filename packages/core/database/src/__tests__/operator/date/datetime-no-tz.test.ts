/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database, Repository } from '@nocobase/database';

describe('datetimeNoTz date operator test', () => {
  let db: Database;

  let repository: Repository;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase({
      timezone: '+00:00',
    });

    await db.clean({ drop: true });
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'date1',
          type: 'datetimeNoTz',
        },
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    repository = Test.repository;
    await db.sync();
  });

  test('$dateOn', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01 00:00:00',
          name: 'u0',
        },
        {
          date1: '2023-01-01 00:00:00',
          name: 'u1',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u2',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u3',
        },
      ],
    });

    let count: number;

    count = await repository.count({
      filter: {
        'date1.$dateOn': '2023-01-01',
      },
    });

    expect(count).toBe(2);

    count = await repository.count({
      filter: {
        'date1.$dateOn': '2022-12-31',
      },
    });

    expect(count).toBe(2);

    count = await repository.count({
      filter: {
        'date1.$dateOn': '2022-12-31 16:00:00',
      },
    });

    expect(count).toBe(2);

    count = await repository.count({
      filter: {
        'date1.$dateOn': '2022-12-31 16:00:01',
      },
    });

    expect(count).toBe(0);
  });

  test('$dateBefore', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01 00:00:00',
          name: 'u0',
        },
        {
          date1: '2023-01-01 00:00:00',
          name: 'u1',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u2',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u3',
        },
      ],
    });

    let count: number;

    count = await repository.count({
      filter: {
        'date1.$dateBefore': '2023-01-01',
      },
    });
    expect(count).toBe(2);

    count = await repository.count({
      filter: {
        'date1.$dateBefore': '2022-12-31',
      },
    });

    expect(count).toBe(0);
  });

  test('$dateBefore2', async () => {
    await repository.create({
      values: [
        {
          date1: '2024-09-08 15:33:54',
          name: 'u0',
        },
      ],
    });

    const count = await repository.count({
      filter: {
        'date1.$dateBefore': '2024-09-08 15:33:55',
      },
    });

    expect(count).toBe(1);
  });

  test('dateBetween', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01 00:00:00',
          name: 'u0',
        },
        {
          date1: '2023-01-01 00:00:00',
          name: 'u1',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u2',
        },
        {
          date1: '2022-12-31 16:00:00',
          name: 'u3',
        },
      ],
    });

    let count: number;

    count = await repository.count({
      filter: {
        'date1.$dateBetween': ['2022-12-31', '2023-01-01'],
      },
    });

    expect(count).toBe(4);

    count = await repository.count({
      filter: {
        'date1.$dateBetween': ['2022-12-31 16:00:00', '2023-01-01 00:00:00'],
      },
    });

    expect(count).toBe(4);

    count = await repository.count({
      filter: {
        'date1.$dateBetween': ['2022-12-31 11:00:00', '2022-12-31 17:00:00'],
      },
    });

    expect(count).toBe(2);
  });
});
