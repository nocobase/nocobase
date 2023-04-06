import Database, { Collection as DBCollection } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('reverseField options', () => {
  let db: Database;
  let app: MockServer;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
    await Collection.repository.create({
      values: {
        name: 'tests',
      },
    });
    await Collection.repository.create({
      values: {
        name: 'targets',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('reverseField', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        reverseField: {},
      },
    });

    const json = JSON.parse(JSON.stringify(field.toJSON()));
    expect(json).toMatchObject({
      type: 'hasMany',
      collectionName: 'tests',
      target: 'targets',
      targetKey: 'id',
      sourceKey: 'id',
      reverseField: {
        type: 'belongsTo',
        collectionName: 'targets',
        target: 'tests',
        targetKey: 'id',
        sourceKey: 'id',
      },
    });
    expect(json.foreignKey).toBe(json.reverseField.foreignKey);
  });

  it('should sync onDelete options for reverse field', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        onDelete: 'CASCADE',
        reverseField: {},
      },
    });

    const { reverseField } = field.toJSON();

    expect(reverseField.onDelete).toBe('CASCADE');
  });

  it('should update reverseField onDelete options', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        onDelete: 'CASCADE',
        reverseField: {},
      },
    });

    const { reverseField } = field.toJSON();

    await Field.repository.update({
      filterByTk: reverseField.key,
      values: {
        onDelete: 'SET NULL',
      },
    });

    const mainField = await Field.repository.findOne({
      filterByTk: field.get('key'),
    });

    expect(mainField.get('onDelete')).toBe('SET NULL');
  });

  it('should update reverseField', async () => {
    const field = await Field.repository.create({
      values: {
        type: 'hasMany',
        collectionName: 'tests',
        target: 'targets',
        reverseField: {},
      },
    });

    expect(
      await Field.repository.count({
        filter: {
          collectionName: 'targets',
        },
      }),
    ).toEqual(1);

    let reverseField = await Field.repository.findOne({
      filter: {
        collectionName: 'targets',
      },
    });

    let err;

    try {
      await Field.repository.update({
        filterByTk: field.get('key') as string,
        values: {
          reverseField: {
            uiSchema: {
              title: '123',
            },
          },
        },
      });
    } catch (e) {
      err = e;
    }

    expect(err).toBeDefined();

    await Field.repository.update({
      filterByTk: field.get('key') as string,
      updateAssociationValues: ['reverseField'],
      values: {
        reverseField: {
          key: reverseField.get('key'),
          uiSchema: {
            title: '123',
          },
        },
      },
    });

    expect(
      await Field.repository.count({
        filter: {
          collectionName: 'targets',
        },
      }),
    ).toEqual(1);

    reverseField = await db.getRepository('fields').findOne({
      filter: {
        key: reverseField.get('key'),
      },
    });

    const uiSchema = reverseField.get('uiSchema');
    expect(uiSchema).toEqual({ title: '123' });
  });

  it('should update uiSchema', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'a',
        },
      });

    const f = await app
      .agent()
      .resource('collections.fields', 'a')
      .create({
        values: {
          name: 'f_i02fjvduwmv',
          interface: 'input',
          type: 'string',
          uiSchema: { type: 'string', 'x-component': 'Input', title: 'A1' },
        },
      });

    await app
      .agent()
      .resource('collections.fields', 'a')
      .update({
        filterByTk: 'f_i02fjvduwmv',
        values: {
          ...f.body.data,
          uiSchema: {
            ...f.body.data.uiSchema,
            title: 'A2',
          },
        },
      });

    const f2 = await app.agent().resource('collections.fields', 'a').get({
      filterByTk: 'f_i02fjvduwmv',
    });

    expect(f2.body.data.uiSchema.title).toBe('A2');
  });

  it('should create reverseField uiSchema', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'a',
        },
      });

    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'b',
        },
      });

    await app
      .agent()
      .resource('collections.fields', 'a')
      .create({
        values: {
          foreignKey: 'f_qnt8iaony6i',
          onDelete: 'SET NULL',
          reverseField: {
            uiSchema: {
              title: 'A',
              'x-component': 'RecordPicker',
              'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
            },
            interface: 'obo',
            type: 'belongsTo',
            name: 'f_dctw6v5gsio',
          },
          name: 'f_d5ebrb4h85m',
          type: 'hasOne',
          uiSchema: {
            'x-component': 'RecordPicker',
            'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
            title: 'B',
          },
          interface: 'oho',
          target: 'b',
        },
      });

    const f1 = await app.agent().resource('collections.fields', 'b').get({
      filterByTk: 'f_dctw6v5gsio',
    });

    expect(f1.body.data.uiSchema.title).toBe('A');
  });
});
