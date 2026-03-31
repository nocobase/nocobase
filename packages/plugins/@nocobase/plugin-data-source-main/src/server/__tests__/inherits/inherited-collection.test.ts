/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, {
  BelongsToManyRepository,
  BelongsToRepository,
  HasManyRepository,
  Repository,
} from '@nocobase/database';
import Application from '@nocobase/server';
import { isPg } from '@nocobase/test';
import { createApp } from '..';

const pgOnly = () => (isPg() ? describe : describe.skip);

pgOnly()('Inherited Collection', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        prefix: '',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should return child model at get action in belongsTo', async () => {
    await collectionRepository.create({
      values: {
        name: 'parent',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'child',
        fields: [{ type: 'string', name: 'childName' }],
        inherits: ['parent'],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsTo', name: 'assoc', target: 'parent' },
        ],
      },
      context: {},
    });

    const child1 = await db.getRepository('child').create({
      values: {
        name: 'child1',
        childName: 'child1',
      },
    });

    const parent1 = await db.getRepository('parent').create({
      values: {
        name: 'parent1',
      },
    });

    const user1 = await db.getRepository('users').create({
      values: {
        name: 'user1',
        assoc: { id: child1.id },
      },
    });

    const child1ViaObject1 = await db.getRepository<BelongsToRepository>('users.assoc', user1.get('id')).findOne({
      targetCollection: 'child',
    });

    expect(child1ViaObject1.get('childName')).toBe('child1');
    expect(child1ViaObject1.get('__collection')).toBe('child');

    await db.getRepository<BelongsToRepository>('users.assoc', user1.get('id')).update({
      values: {
        childName: 'child2',
        __collection: 'child',
      },
    });

    const child2 = await db.getRepository<BelongsToRepository>('users.assoc', user1.get('id')).findOne({
      targetCollection: 'child',
    });

    expect(child2.get('childName')).toBe('child2');
  });

  it('should return child model at get action in belongsToMany', async () => {
    await collectionRepository.create({
      values: {
        name: 'parent',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'child',
        fields: [{ type: 'string', name: 'childName' }],
        inherits: ['parent'],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'object',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'belongsToMany', name: 'assocs', target: 'parent' },
        ],
      },

      context: {},
    });

    const child1 = await db.getRepository('child').create({
      values: {
        name: 'child1',
        childName: 'child1',
      },
    });

    const parent1 = await db.getRepository('parent').create({
      values: {
        name: 'parent1',
      },
    });

    const object1 = await db.getRepository('object').create({
      values: {
        name: 'object1',
        assocs: [{ id: parent1.id }, { id: child1.id }],
      },
    });

    const child1ViaObject1 = await db.getRepository<BelongsToManyRepository>('object.assocs', object1.id).findOne({
      filterByTk: child1.get('id'),
      targetCollection: 'child',
    });

    expect(child1ViaObject1.get('childName')).toBe('child1');
  });

  it('should return child model at get action in hasMany', async () => {
    await collectionRepository.create({
      values: {
        name: 'parent',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'child',
        fields: [{ type: 'string', name: 'childName' }],
        inherits: ['parent'],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'object',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'assocs', target: 'parent', foreignKey: 'object_id' },
        ],
      },

      context: {},
    });

    const child1 = await db.getRepository('child').create({
      values: {
        name: 'child1',
        childName: 'child1',
      },
    });

    const parent1 = await db.getRepository('parent').create({
      values: {
        name: 'parent1',
      },
    });

    const object1 = await db.getRepository('object').create({
      values: {
        name: 'object1',
        assocs: [{ id: parent1.id }, { id: child1.id }],
      },
    });

    const child1ViaObject1 = await db.getRepository<HasManyRepository>('object.assocs', object1.id).findOne({
      filterByTk: child1.get('id'),
      targetCollection: 'child',
    });

    expect(child1ViaObject1.get('childName')).toBe('child1');

    await db.getRepository<HasManyRepository>('object.assocs', object1.id).update({
      filterByTk: child1.get('id'),
      targetCollection: 'child',
      values: {
        childName: 'child2',
      },
    });

    const child2 = await db.getRepository<HasManyRepository>('object.assocs', object1.id).findOne({
      filterByTk: child1.get('id'),
      targetCollection: 'child',
    });

    expect(child2.get('childName')).toBe('child2');

    await db.getRepository<HasManyRepository>('object.assocs', object1.id).update({
      filterByTk: child1.get('id'),
      values: {
        __collection: 'child',
        childName: 'child3',
      },
    });

    const child3 = await db.getRepository<HasManyRepository>('object.assocs', object1.id).findOne({
      filterByTk: child1.get('id'),
      targetCollection: 'child',
    });

    expect(child3.get('childName')).toBe('child3');
  });

  it('should update overridden multiple select field', async () => {
    await collectionRepository.create({
      values: {
        name: 'parent',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'array',
            name: 'selectors',
            uiSchema: {
              enum: [{ value: '123', label: '123' }],
            },
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'child',
        inherits: ['parent'],
        fields: [
          {
            type: 'array',
            name: 'selectors',
            uiSchema: {
              enum: [{ value: '123', label: '123' }],
            },
            overriding: true,
          },
        ],
      },
      context: {},
    });

    await fieldsRepository.update({
      filter: {
        name: 'selectors',
        collectionName: 'child',
      },
      values: {
        uiSchema: {
          enum: [{ value: '223', label: '223' }],
        },
        defaultValue: [],
      },
    });
  });

  it("should not delete child's field when parent field delete that inherits from multiple table", async () => {
    await collectionRepository.create({
      values: {
        name: 'b',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'c',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'a',
        inherits: ['b', 'c'],
      },
      context: {},
    });

    await fieldsRepository.create({
      values: {
        collectionName: 'a',
        name: 'name',
        type: 'string',
      },
    });

    await db.getCollection('fields').repository.destroy({
      filter: {
        collectionName: 'b',
        name: 'name',
      },
    });

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'a',
          name: 'name',
        },
      }),
    ).not.toBeNull();

    await db.getCollection('fields').repository.destroy({
      filter: {
        collectionName: 'c',
        name: 'name',
      },
    });

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'a',
          name: 'name',
        },
      }),
    ).toBeNull();
  });

  it("should delete child's field when parent field deleted", async () => {
    await collectionRepository.create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'students',
        inherits: ['person'],
      },
      context: {},
    });

    await db.getCollection('fields').repository.create({
      values: {
        collectionName: 'students',
        name: 'name',
        type: 'string',
      },
      context: {},
    });

    await db.getCollection('fields').repository.create({
      values: {
        collectionName: 'students',
        name: 'age',
        type: 'integer',
      },
      context: {},
    });

    const childNameField = await db.getCollection('fields').repository.findOne({
      filter: {
        collectionName: 'students',
        name: 'name',
      },
    });

    expect(childNameField.get('overriding')).toBeTruthy();

    await db.getCollection('fields').repository.destroy({
      filter: {
        collectionName: 'person',
        name: 'name',
      },
    });

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'students',
          name: 'name',
        },
      }),
    ).toBeNull();

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'students',
          name: 'age',
        },
      }),
    ).not.toBeNull();

    await db.getCollection('fields').repository.create({
      values: {
        collectionName: 'person',
        name: 'age',
        type: 'integer',
      },
      context: {},
    });

    await db.getCollection('fields').repository.destroy({
      filter: {
        collectionName: 'person',
        name: 'age',
      },
    });

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'person',
          name: 'age',
        },
      }),
    ).toBeNull();

    expect(
      await db.getCollection('fields').repository.findOne({
        filter: {
          collectionName: 'students',
          name: 'age',
        },
      }),
    ).not.toBeNull();
  });

  it('should not inherit with difference type', async () => {
    const personCollection = await collectionRepository.create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    let err;
    try {
      const studentCollection = await collectionRepository.create({
        values: {
          name: 'students',
          inherits: 'person',
          fields: [
            {
              name: 'name',
              type: 'integer',
            },
          ],
        },
        context: {},
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();
    expect(err.message.includes('type conflict')).toBeTruthy();
  });

  it('should replace parent collection field', async () => {
    const personCollection = await collectionRepository.create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const studentCollection = await collectionRepository.create({
      values: {
        name: 'students',
        inherits: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
            title: '姓名',
          },
        ],
      },
      context: {},
    });

    const studentFields = await studentCollection.getFields();
    expect(studentFields.length).toBe(1);
    expect(studentFields[0].get('title')).toBe('姓名');
  });

  it('should remove parent collections field', async () => {
    await collectionRepository.create({
      values: {
        name: 'person',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'students',
        fields: [
          {
            name: 'score',
            type: 'integer',
          },
        ],
      },
      context: {},
    });

    const studentCollection = await db.getCollection('students');

    await studentCollection.repository.create({
      values: {
        name: 'foo',
        score: 100,
      },
    });
  });
});
