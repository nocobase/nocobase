/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Collection, createMockDatabase } from '@nocobase/database';

describe('string operator', () => {
  let db: Database;

  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync({
      force: true,
    });
  });

  it('should escape underscore in include operator', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        'name.$includes': '_',
      },
    });

    expect(u1Res).toBeNull();
  });

  it('should query with include operator with array values', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'u2',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$includes': ['u1', 'u2'],
      },
    });

    expect(res.length).toEqual(2);
  });

  it('should query $notIncludes with array values', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'u2',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$notIncludes': ['u1', 'u2'],
      },
    });

    expect(res.length).toEqual(0);
  });

  it('should query $notIncludes', async () => {
    await db.getRepository('users').create({
      values: {
        name: 'u1',
      },
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$notIncludes': 'u1',
      },
    });

    expect(res.length).toEqual(0);
  });

  it('should query $startsWith', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'b1',
        },
        {
          name: 'c1',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$startsWith': ['u', 'b'],
      },
    });

    expect(res.length).toEqual(2);
  });

  it('should query $notStartsWith', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'v2',
        },
        {
          name: 'b1',
        },
        {
          name: 'b2',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$notStartsWith': ['u', 'v'],
      },
    });

    expect(res.length).toEqual(2);
  });

  it('should query $endWith', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'b1',
        },
        {
          name: 'c1',
        },
        {
          name: 'u2',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$endWith': ['1'],
      },
    });

    expect(res.length).toEqual(3);
  });

  it('should query $notEndWith', async () => {
    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'b1',
        },
        {
          name: 'c1',
        },
        {
          name: 'u2',
        },
      ],
    });

    const res = await db.getRepository('users').find({
      filter: {
        'name.$notEndWith': ['1'],
      },
    });

    expect(res.length).toEqual(1);
  });

  it('should query with include operator', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        'name.$includes': 'u1',
      },
    });

    expect(u1Res.get('id')).toEqual(u1.get('id'));
  });

  it('should query with and ', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });

    const u1Res = await db.getRepository('users').findOne({
      filter: {
        $and: [
          {
            'name.$includes': 'u1',
          },
        ],
      },
    });

    expect(u1Res.get('id')).toEqual(u1.get('id'));
  });
});
