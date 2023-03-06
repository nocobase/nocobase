import { MockServer } from '@nocobase/test';
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
        name: 'post_tag',
        createdBy: true,
        updatedBy: true,
        sortable: true,
        logging: true,
        fields: [
          {
            name: 'id',
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: {
              type: 'number',
              title: '{{t("ID")}}',
              'x-component': 'InputNumber',
              'x-read-pretty': true,
            },
            interface: 'id',
          },
        ],
        title: 'post_tag',
      },
    });

    await agent.resource('tags').create({
      values: {},
    });

    const response0 = await agent.resource('collections.fields', 'posts').create({
      values: {
        foreignKey: 'post_id',
        otherKey: 'tag_id',
        name: 'tags',
        type: 'belongsToMany',
        uiSchema: {
          'x-component': 'RecordPicker',
          'x-component-props': {
            multiple: true,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
          title: 'tags',
        },
        interface: 'm2m',
        through: 'post_tag',
        target: 'tags',
      },
    });

    expect(response0.status).toBe(200);

    const TagRepository = db.getCollection('tags').repository;
    const PostRepository = db.getCollection('posts').repository;

    const tag = await TagRepository.findOne();

    expect(!!tag).toBeTruthy();

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
      filterByTk: 'post_tag',
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

    const response2 = await agent.resource('posts').create({
      values: {
        tags: [tag.id],
      },
    });

    expect(response2.status).toBe(200);
  });
});
