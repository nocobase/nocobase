import { mockDatabase } from '../';
import { Database } from '../../database';
import { IdentifierError } from '../../errors/identifier-error';

describe('belongs to many field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should check belongs to many association keys', async () => {
    const PostTag = db.collection({
      name: 'postsTags',
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
        {
          type: 'text',
          name: 'postId',
        },
        {
          type: 'text',
          name: 'tagId',
        },
      ],
    });

    await db.sync();

    const Post = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'name' }],
    });

    const Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });

    let error;

    try {
      Post.setField('tags', {
        type: 'belongsToMany',
        through: 'postsTags',
        target: 'tags',
        foreignKey: 'postId',
        otherKey: 'tagId',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    console.log(error.message);
  });

  it('should define belongs to many when change alias name', async () => {
    const Through = db.collection({
      name: 't1',
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    const A = db.collection({
      name: 'a',
    });

    const B = db.collection({
      name: 'b',
    });

    await db.sync();

    let error;

    expect(Object.keys(A.model.associations).length).toEqual(0);
    try {
      A.setField('t1', {
        type: 'belongsToMany',
        through: 't1',
        target: 't1',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();

    expect(Object.keys(A.model.associations).length).toEqual(0);
    let error2;
    try {
      A.setField('xxx', {
        type: 'belongsToMany',
        through: 't1',
        target: 't1',
      });
    } catch (e) {
      error2 = e;
    }

    expect(error2).not.toBeDefined();
  });

  it('should define belongs to many relation through exists pivot collection', async () => {
    const PostTag = db.collection({
      name: 'postsTags',
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    expect(PostTag.model.rawAttributes['id']).toBeDefined();

    const Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts', through: 'postsTags' },
      ],
    });

    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags', through: 'postsTags' },
      ],
    });

    expect(PostTag.model.rawAttributes['id']).toBeDefined();
  });

  test('association undefined', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    expect(Post.model.associations.tags).toBeUndefined();
    expect(db.getCollection('postsTags')).toBeUndefined();

    const Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });
    expect(Post.model.associations.tags).toBeDefined();
    const Through = db.getCollection('postsTags');
    expect(Through).toBeDefined();

    expect(Through.model.rawAttributes['postId']).toBeDefined();
    expect(Through.model.rawAttributes['tagId']).toBeDefined();
  });

  test('redefine collection', () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    expect(Post.model.associations.tags).toBeUndefined();
    expect(db.getCollection('postsTags')).toBeUndefined();

    const Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });

    const PostTag = db.collection({ name: 'postsTags' });

    expect(PostTag.model.rawAttributes['postId']).toBeDefined();
    expect(PostTag.model.rawAttributes['tagId']).toBeDefined();
  });

  it('should throw error when foreignKey is too long', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags', foreignKey: 'a'.repeat(128) },
      ],
    });

    let error;
    try {
      const Tag = db.collection({
        name: 'tags',
        fields: [{ type: 'string', name: 'name' }],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });

  it('should throw error when through is too long', async () => {
    const Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'tags', through: 'a'.repeat(128) },
      ],
    });

    let error;
    try {
      const Tag = db.collection({
        name: 'tags',
        fields: [{ type: 'string', name: 'name' }],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(IdentifierError);
  });
});
