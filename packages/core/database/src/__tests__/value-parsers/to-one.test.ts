import { Database, mockDatabase } from '../..';
import { ToManyValueParser } from '../../value-parsers';

describe('number value parser', () => {
  let parser: ToManyValueParser;
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    await db.sync();
    const r = db.getRepository('users');
    await r.create({
      values: { name: 'user1' },
    });
  });

  afterEach(async () => {
    await db.close();
  });

  const setValue = async (value) => {
    const post = db.getCollection('posts');
    parser = new ToManyValueParser(post.getField('user'), {
      column: {
        dataIndex: ['user', 'name'],
      },
    });
    await parser.setValue(value);
  };

  it('should be correct', async () => {
    await setValue('user1');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toEqual([1]);
  });

  it('should be null', async () => {
    await setValue('user2');
    expect(parser.errors.length).toBe(1);
    expect(parser.getValue()).toBeNull();
  });
});
