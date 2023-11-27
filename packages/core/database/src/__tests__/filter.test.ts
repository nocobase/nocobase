import Database from '../database';
import { mockDatabase } from '../mock-database';

describe('filter', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should filter by belongs to many association', async () => {
    const A = db.collection({
      name: 'a',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'b', target: 'b' },
      ],
    });

    const B = db.collection({
      name: 'b',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'c', target: 'c' },
        { type: 'belongsTo', name: 'd', target: 'd' },
      ],
    });

    const C = db.collection({
      name: 'c',
      fields: [{ type: 'string', name: 'name' }],
    });

    const D = db.collection({
      name: 'd',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();

    const findArgs = {
      filter: {
        $and: [{ b: { c: { name: { $eq: 'c1' } } } }, { b: { d: { name: { $eq: 'd1' } } } }],
      },
    };

    const findOptions = A.repository.buildQueryOptions(findArgs);

    const include = findOptions.include;

    const associationB = include.find((i) => i.association === 'b');
    expect(associationB).toBeDefined();
    expect(associationB.include).toHaveLength(2);

    let err;
    try {
      await A.repository.find({ ...findArgs });
    } catch (e) {
      err = e;
    }

    expect(err).toBeUndefined();
  });

  it('should filter by hasMany association field', async () => {
    const DeptCollection = db.collection({
      name: 'depts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'org', target: 'orgs' },
      ],
    });

    const OrgCollection = db.collection({
      name: 'orgs',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'depts', target: 'depts' },
      ],
    });

    await db.sync();

    await OrgCollection.repository.create({
      values: [
        {
          name: 'org1',
          depts: [{ name: 'dept1' }, { name: 'dept2' }],
        },
        {
          name: 'org2',
          depts: [{ name: 'dept3' }, { name: 'dept4' }],
        },
      ],
    });

    const dept1 = await DeptCollection.repository.findOne({});

    const orgs = await OrgCollection.repository.find({
      filter: { $and: [{ depts: { id: { $eq: dept1.get('id') } } }] },
    });

    expect(orgs.length).toBe(1);
  });

  it('should filter by association field', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();

    const user = await UserCollection.repository.create({
      values: {
        name: 'John',
        posts: [
          {
            title: 'p1',
          },
          {
            title: 'p2',
          },
        ],
      },
    });

    const userCreatedAt = user.get('createdAt');
    const year = userCreatedAt.getFullYear();
    const month = userCreatedAt.getMonth() + 1; // 月份从0开始，因此加1
    const date = userCreatedAt.getDate();
    const count = await PostCollection.repository.count({
      filter: {
        'user.createdAt': {
          $dateOn: `${year}-${month}-${date}`,
        },
      },
    });

    expect(count).toBe(2);
  });
});
