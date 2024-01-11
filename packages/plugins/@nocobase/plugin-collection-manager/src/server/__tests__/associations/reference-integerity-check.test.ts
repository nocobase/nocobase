import Database from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('reference integrity check', () => {
  let db: Database;
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      database: {
        tablePrefix: '',
      },
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should delete cascade on belongs to many relation', async () => {
    const posts = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsToMany', name: 'tags', onDelete: 'CASCADE' },
      ],
    });

    const tags = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
          onDelete: 'CASCADE',
        },
      ],
    });

    await db.sync();

    const post = await posts.repository.create({
      values: {
        title: 'post',
        tags: [{ name: 't1' }, { name: 't2' }],
      },
    });

    // @ts-ignore
    const throughModel = posts.model.associations.tags.through.model;

    expect(await throughModel.count()).toEqual(2);

    await post.destroy();

    expect(await throughModel.count()).toEqual(0);

    expect(db.referenceMap.getReferences('posts').length > 0).toBeTruthy();
    expect(db.referenceMap.getReferences('tags').length > 0).toBeTruthy();

    tags.removeField('posts');
    tags.removeField('tags');

    expect(db.referenceMap.getReferences('posts').length == 0).toBeTruthy();
    expect(db.referenceMap.getReferences('tags').length == 0).toBeTruthy();
  });

  it('should clean reference after collection destroy', async () => {
    const users = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasOne',
          name: 'profile',
          onDelete: 'CASCADE',
        },
      ],
    });

    const profiles = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'integer',
          name: 'age',
        },
        {
          type: 'belongsTo',
          name: 'user',
          onDelete: 'CASCADE',
        },
      ],
    });

    await db.sync();

    expect(db.referenceMap.getReferences('users').length).toEqual(1);

    await users.repository.create({
      values: {
        name: 'foo',
        profile: {
          age: 18,
        },
      },
    });

    db.removeCollection('profiles');

    expect(db.referenceMap.getReferences('users').length).toEqual(0);

    await users.repository.destroy({
      filter: {
        name: 'foo',
      },
    });
  });
});
