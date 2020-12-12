import { getDatabase } from '..';
import Database from '../../database';



describe('getScopedValues', () => {
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
    const where = Post.getScopedValues(post, ['status']);
    expect(where).toEqual({ status: 'published' });
  });

  it('non-exist column', async () => {
    const Post = db.getModel('posts');
    const post = await Post.create({});
    const where = Post.getScopedValues(post, ['whatever']);
    expect(where).toEqual({});
  });
});
