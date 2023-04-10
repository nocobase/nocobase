import Database from '../../database';
import { Repository } from '../../repository';
import { mockDatabase } from '../index';

describe('date operator test', () => {
  let db: Database;

  let repository: Repository;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({
      timezone: '+00:00',
    });
    await db.clean({ drop: true });
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'date1',
          type: 'date',
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
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateOn': '2023',
      },
    });
    expect(count).toBe(2);
    count = await repository.count({
      filter: {
        'date1.$dateOn': '2023+08:00',
      },
    });
    expect(count).toBe(4);
  });

  test('$dateNotOn', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateNotOn': '2023',
      },
    });
    expect(count).toBe(2);
    count = await repository.count({
      filter: {
        'date1.$dateNotOn': '2023+08:00',
      },
    });
    expect(count).toBe(0);
  });

  test('$dateBefore', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
        {
          date1: '2022-12-30T15:59:59.999Z',
          name: 'u4',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateBefore': '2023',
      },
    });
    expect(count).toBe(3);
    count = await repository.count({
      filter: {
        'date1.$dateBefore': '2023+08:00',
      },
    });
    expect(count).toBe(1);
  });

  test('$dateNotBefore', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
        {
          date1: '2022-12-30T15:59:59.999Z',
          name: 'u4',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateNotBefore': '2023',
      },
    });
    expect(count).toBe(2);
    count = await repository.count({
      filter: {
        'date1.$dateNotBefore': '2023+08:00',
      },
    });
    expect(count).toBe(4);
  });

  test('$dateAfter', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
        {
          date1: '2022-12-30T15:59:59.999Z',
          name: 'u4',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateAfter': '2022',
      },
    });
    expect(count).toBe(2);
    count = await repository.count({
      filter: {
        'date1.$dateAfter': '2022+08:00',
      },
    });
    expect(count).toBe(4);
  });

  test('$dateNotAfter', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-01T00:00:00.001Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
        {
          date1: '2022-12-30T15:59:59.999Z',
          name: 'u4',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateNotAfter': '2022',
      },
    });
    expect(count).toBe(3);
    count = await repository.count({
      filter: {
        'date1.$dateNotAfter': '2022+08:00',
      },
    });
    expect(count).toBe(1);
  });

  test('$dateBetween', async () => {
    await repository.create({
      values: [
        {
          date1: '2023-01-01T00:00:00.000Z',
          name: 'u0',
        },
        {
          date1: '2023-01-05T16:00:00.000Z',
          name: 'u1',
        },
        {
          date1: '2022-12-31T16:00:00.000Z',
          name: 'u2',
        },
        {
          date1: '2022-12-31T16:00:00.001Z',
          name: 'u3',
        },
        {
          date1: '2022-12-30T15:59:59.999Z',
          name: 'u4',
        },
        {
          date1: '2023-01-04T16:00:00.000Z',
          name: 'u1',
        },
      ],
    });
    let count: number;
    count = await repository.count({
      filter: {
        'date1.$dateBetween': '[2023-01-01,2023-01-05]',
      },
    });
    expect(count).toBe(3);
    count = await repository.count({
      filter: {
        'date1.$dateBetween': '[2023-01-01,2023-01-05]+08:00',
      },
    });
    expect(count).toBe(4);
  });
});
