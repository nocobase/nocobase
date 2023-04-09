import { markAsMultiFieldParsedValue } from '@nocobase/utils';
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

    // 返回的日期是 2023-01-01T00:00:00.000Z 或者 2023-01-01T00:00:00.001Z
    const list = await repository.find({
      filter: {
        'date1.$dateOn': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2022-12-31T16:00:00.000Z']),
      },
    });
    expect(list.length).toBe(2);
    expect(list[0].get('name')).toBe('u0');
    expect(list[1].get('name')).toBe('u2');
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

    // 返回的日期即不是 2023-01-01T00:00:00.000Z 也不是 2023-01-01T00:00:00.001Z
    const list = await repository.find({
      filter: {
        'date1.$dateNotOn': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2023-01-01T00:00:00.001Z']),
      },
    });
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('u2');
    expect(list[1].name).toBe('u3');
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

    // 返回的日期应该即早于 2023-01-01T00:00:00.000Z 又早于 2022-12-31T16:00:00.000Z
    const list = await repository.find({
      filter: {
        'date1.$dateBefore': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2022-12-31T16:00:00.000Z']),
      },
    });
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('u4');
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

    // 返回的日期应该即不早于 2023-01-01T00:00:00.000Z 又不早于 2022-12-31T16:00:00.000Z
    const list = await repository.find({
      filter: {
        'date1.$dateNotBefore': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2022-12-31T16:00:00.000Z']),
      },
    });
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('u0');
    expect(list[1].name).toBe('u1');
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

    // 返回的日期应该即晚于 2023-01-01T00:00:00.000Z 又晚于 2022-12-31T16:00:00.000Z
    const list = await repository.find({
      filter: {
        'date1.$dateAfter': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2022-12-31T16:00:00.000Z']),
      },
    });
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('u1');
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

    // 返回的日期应该即不晚于 2023-01-01T00:00:00.000Z 又不晚于 2022-12-31T16:00:00.000Z
    const list = await repository.find({
      filter: {
        'date1.$dateNotAfter': markAsMultiFieldParsedValue (['2023-01-01T00:00:00.000Z', '2022-12-31T16:00:00.000Z']),
      },
    });
    expect(list.length).toBe(2);
    expect(list[0].name).toBe('u2');
    expect(list[1].name).toBe('u4');
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
