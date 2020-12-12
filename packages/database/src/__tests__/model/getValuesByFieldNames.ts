import { getDatabase } from '..';
import Database from '../../database';



describe('getValuesByFieldNames', () => {
  let db: Database;

  beforeEach(async () => {
    db = getDatabase();
    db.table({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'status'
        }
      ]
    });
    await db.sync({ force: true });
  });

  afterEach(() => db.close());

  it('exist column', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({ status: 'published' });
    const where = post.getScopedValues(['status']);
    expect(where).toEqual({ status: 'published' });
  });

  it('non-exist column', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({});
    const where = post.getScopedValues(['whatever']);
    expect(where).toEqual({});
  });
});
