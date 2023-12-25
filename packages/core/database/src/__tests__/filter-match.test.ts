import { Database } from '..';
import { filterMatch } from '../filter-match';
import { mockDatabase } from './index';

describe('filterMatch', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('filter match', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    await db.sync();

    const post = await Post.repository.create({
      values: { title: 't1' },
    });

    expect(
      filterMatch(post, {
        title: 't1',
      }),
    ).toBeTruthy();

    expect(
      filterMatch(post, {
        $or: [{ title: 't1' }, { title: 't2' }],
      }),
    ).toBeTruthy();

    expect(
      filterMatch(post, {
        $and: [{ title: 't1' }, { title: 't2' }],
      }),
    ).toBeFalsy();

    expect(
      filterMatch(post, {
        title: 't2',
      }),
    ).toBeFalsy();
  });
});
