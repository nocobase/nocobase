import Database, { Collection, mockDatabase } from '@nocobase/database';
import { markValueAsJsonata } from '@nocobase/utils';

describe('string operator', () => {
  let db: Database;

  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync({
      force: true,
    });
  });

  it('should query with include operator', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'names of u2',
      },
    });
    const res = await db.getRepository('users').findOne({
      filter: {
        'name.$includes': 'u1',
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        'name.$includes': markValueAsJsonata(['u1', 'u2']),
      },
    });

    expect(res.get('id')).toBe(u1.get('id'));
    expect(res2.length).toBe(2);
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

    expect(u1Res.get('id')).toBe(u1.get('id'));
  });

  it('$notIncludes', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'names of u2',
      },
    });

    const res = await db.getRepository('users').findOne({
      filter: {
        $and: [
          {
            'name.$notIncludes': 'u1',
          },
        ],
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$notIncludes': markValueAsJsonata(['u2']),
          },
        ],
      },
    });

    expect(res.get('id')).toBe(u2.get('id'));
    expect(res2.length).toBe(1);
    expect(res2[0].get('id')).toBe(u1.get('id'));
  });

  it('$startsWith', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'u1 name',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'u2 name',
      },
    });

    const res = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$startsWith': 'u',
          },
        ],
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$startsWith': markValueAsJsonata(['u1', 'u2']),
          },
        ],
      },
    });

    expect(res.length).toBe(2);
    expect(res2.length).toBe(2);
    expect(res2[0].get('id')).toBe(u1.get('id'));
    expect(res2[1].get('id')).toBe(u2.get('id'));
  });

  it('$notStartsWith', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'u1 name',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'u2 name',
      },
    });
    const res = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$notStartsWith': 'u',
          },
        ],
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$notStartsWith': markValueAsJsonata(['u1', 'u2']),
          },
        ],
      },
    });

    expect(res.length).toBe(0);
    expect(res2.length).toBe(0);
  });

  it('$endWith', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'names of u2',
      },
    });
    const res = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$endWith': 'u1',
          },
        ],
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$endWith': markValueAsJsonata(['u1', 'u2']),
          },
        ],
      },
    });

    expect(res.length).toBe(1);
    expect(res[0].get('id')).toBe(u1.get('id'));
    expect(res2.length).toBe(2);
    expect(res2[0].get('id')).toBe(u1.get('id'));
    expect(res2[1].get('id')).toBe(u2.get('id'));
  });

  it('$notEndWith', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'names of u1',
      },
    });
    const u2 = await db.getRepository('users').create({
      values: {
        name: 'names of u2',
      },
    });
    const res = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$notEndWith': 'u1',
          },
        ],
      },
    });

    // array
    const res2 = await db.getRepository('users').find({
      filter: {
        $and: [
          {
            'name.$notEndWith': markValueAsJsonata(['u1', 'u2']),
          },
        ],
      },
    });

    expect(res.length).toBe(1);
    expect(res[0].get('id')).toBe(u2.get('id'));
    expect(res2.length).toBe(0);
  });
});
