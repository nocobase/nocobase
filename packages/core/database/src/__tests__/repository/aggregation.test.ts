import { HasManyRepository, mockDatabase } from '../../index';
import Database from '../../database';
import { Collection } from '../../collection';

describe('association aggregation', () => {
  let db: Database;

  let User: Collection;
  let Post: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'category',
        },
        {
          type: 'integer',
          name: 'readCount',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        {
          name: 'u1',
          age: 1,
          posts: [
            { title: 'p1', category: 'c1', readCount: 1 },
            { title: 'p2', category: 'c2', readCount: 2 },
          ],
        },
        {
          name: 'u2',
          age: 2,
          posts: [
            { title: 'p3', category: 'c3', readCount: 3 },
            { title: 'p4', category: 'c4', readCount: 4 },
          ],
        },
      ],
    });
  });

  it('should sum field', async () => {
    const user1 = await User.repository.findOne({
      filter: {
        name: 'u1',
      },
    });

    const PostRepository = await db.getRepository<HasManyRepository>('users.posts', user1.get('id'));
    const sumResult = await PostRepository.aggregate({
      field: 'readCount',
      method: 'sum',
    });

    expect(sumResult).toEqual(3);
  });
});

describe('Aggregation', () => {
  let db: Database;

  let User: Collection;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

    User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'integer',
          name: 'age',
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: [
        { name: 'u1', age: 1 },
        { name: 'u2', age: 2 },
        { name: 'u3', age: 3 },
        { name: 'u4', age: 4 },
        { name: 'u5', age: 5 },
        { name: 'u5', age: 5 },
      ],
    });
  });

  describe('sum', () => {
    it('should sum field', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
      });

      expect(sumResult).toEqual(20);
    });

    it('should sum with distinct', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
        distinct: true,
      });

      expect(sumResult).toEqual(15);
    });

    it('should sum with filter', async () => {
      const sumResult = await User.repository.aggregate({
        method: 'sum',
        field: 'age',
        filter: {
          name: 'u5',
        },
      });

      expect(sumResult).toEqual(10);
    });
  });
});
