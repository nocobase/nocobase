import { Database } from '../../database';
import { mockDatabase } from '../';

describe('belongs to many field', () => {
  let db: Database;

  beforeEach(() => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('association undefined', async () => {
    const Post = db.collection({
      name: 'posts',
      schema: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });
    expect(Post.model.associations.tags).toBeUndefined();
    expect(db.getCollection('posts_tags')).toBeUndefined();
    const Tag = db.collection({
      name: 'tags',
      schema: [
        { type: 'string', name: 'name' },
      ],
    });
    expect(Post.model.associations.tags).toBeDefined();
    const Through = db.getCollection('posts_tags');
    expect(Through).toBeDefined();
    expect(Through.model.rawAttributes['postId']).toBeDefined();
    expect(Through.model.rawAttributes['tagId']).toBeDefined();
    const PostTag = db.collection({
      name: 'posts_tags',
    });
    expect(PostTag.model.rawAttributes['postId']).toBeDefined();
    expect(PostTag.model.rawAttributes['tagId']).toBeDefined();
  });
});
