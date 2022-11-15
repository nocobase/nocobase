import Database, { Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';
import { pgOnly } from '@nocobase/test';

pgOnly()('Inherited Collection', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  beforeEach(async () => {
    app = await createApp();

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
  });

  afterEach(async () => {
    await app.destroy();
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
    expect(err.message.includes('Type conflict')).toBeTruthy();
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

    console.log(studentCollection.fields);
    await studentCollection.repository.create({
      values: {
        name: 'foo',
        score: 100,
      },
    });
  });
});
