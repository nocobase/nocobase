import { MockServer } from '@nocobase/test';
import { CustomSchemaScopePlugin } from 'packages/samples/custom-signup-page/lib/server';
import { createApp } from '..';

describe('collections repository', () => {
  let app: MockServer;
  let agent;
  let db;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;

    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create belongs to many fields', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'posts',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'tags',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'random_1',
      },
    });

    await agent.resource('tags').create({
      values: {},
    });

    const TagRepository = db.getCollection('tags').repository;
    const PostRepository = db.getCollection('posts').repository;

    const tag = await TagRepository.findOne();

    expect(tag).toBeDefined();

    await agent.resource('collections.fields', 'posts').create({
      values: {
        name: 'tags',
        type: 'belongsToMany',
        target: 'tags',
        through: 'random_1',
        foreignKey: 'post_id',
        otherKey: 'tag_id',
      },
    });

    const random1 = await db.getCollection('collections').repository.findOne({
      filter: {
        name: 'random_1',
      },
    });

    expect(random1).not.toBeNull();

    const response = await agent.resource('posts').create({
      values: {
        tags: [tag.id],
      },
    });

    expect(response.status).toBe(200);

    const post = await PostRepository.findOne({
      appends: ['tags'],
    });

    expect(post.tags.length).toBe(1);

    expect(PostRepository.model.associations['tags']).toBeDefined();

    // destroy through table
    await agent.resource('collections').destroy({
      filterByTk: 'random_1',
    });

    // association deleted
    expect(PostRepository.model.associations['tags']).not.toBeDefined();

    // create association again
    await agent.resource('collections.fields', 'posts').create({
      values: {
        name: 'tags',
        type: 'belongsToMany',
        target: 'tags',
        through: 'random_2', //difference name
        foreignKey: 'post_id',
        otherKey: 'tag_id',
      },
    });

    const postCollection = db.getCollection('posts');

    const response2 = await agent.resource('posts').create({
      values: {
        tags: [tag.id],
      },
    });

    expect(response2.status).toBe(200);
  });
});
