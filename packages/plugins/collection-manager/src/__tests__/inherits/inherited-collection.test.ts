import Database, { Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '..';
import { pgOnly } from '@nocobase/test';

pgOnly()('Inherited Collection', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp();

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should rename inherited collection', async () => {
    const parent = await collectionRepository.create({
      values: {
        name: 'parent',
        timestamps: false,
        fields: [
          {
            name: 'parent-name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const child1 = await collectionRepository.create({
      values: {
        name: 'child1',
        timestamps: false,
        inherits: [parent.get('name')],
        fields: [
          {
            name: 'child-name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    // rename parents
    await db.getCollection('collections').repository.update({
      filter: {
        name: 'parent',
      },
      values: {
        name: 'root',
      },
      context: {},
    });

    const child1Collection = db.getCollection('child1');
    expect(child1Collection.options.inherits).toEqual(['root']);

    await child1Collection.repository.create({
      values: {
        child_name: 'child1',
        parent_name: 'root',
      },
    });
    const rootCollection = db.getCollection('root');
    const rootRecords = await rootCollection.repository.find({});

    expect(rootRecords.length).toEqual(1);
  });

  it('should change inherits option', async () => {
    const createCollection = async (name: string, options = {}) => {
      // check collection exists or not
      const exists = await collectionRepository.findOne({
        filterByTk: name,
      });

      if (exists) {
        await collectionRepository.update({
          filterByTk: name,
          values: {
            ...options,
          },
          context: {},
        });
      } else {
        await collectionRepository.create({
          values: {
            name,
            timestamps: false,
            fields: [
              {
                name: `${name}_name`,
                type: 'string',
              },
            ],
            ...options,
          },
          context: {},
        });
      }
    };

    await createCollection('a');

    await createCollection('b', {
      inherits: ['a'],
    });

    await createCollection('b', {
      inherits: [],
    });

    // collection b should has fields of a collection
    const bFields = await fieldsRepository.find({
      filter: {
        collectionName: 'b',
      },
    });

    expect(bFields.find((item) => item.name === 'a_name')).toBeTruthy();
  });

  it('should support modify inherits option', async () => {
    await collectionRepository.create({
      values: {
        name: 'b',
        timestamps: false,
        fields: [
          {
            name: 'b_name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'c',
        timestamps: false,
        fields: [
          {
            name: 'c_name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'a',
        timestamps: false,
        inherits: ['b'],
        fields: [
          {
            name: 'a_name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.update({
      values: {
        inherits: [], // remove inherits
      },
      filterByTk: 'a',
      context: {},
    });

    const ACollection = db.getCollection('a');
    expect(ACollection.options.inherits).toEqual([]);

    const tableName = ACollection.getTableNameWithSchema();

    const getParents = async () => {
      const querySql = `
        SELECT child_schema.nspname  AS child_schema,
               child_table.relname   AS child_table,
               parent_schema.nspname AS parent_schema,
               parent_table.relname  AS parent_table
        FROM pg_inherits
               JOIN pg_class child_table ON child_table.oid = pg_inherits.inhrelid
               JOIN pg_class parent_table ON parent_table.oid = pg_inherits.inhparent
               JOIN pg_namespace child_schema ON child_schema.oid = child_table.relnamespace
               JOIN pg_namespace parent_schema ON parent_schema.oid = parent_table.relnamespace
        WHERE child_schema.nspname = '${tableName.schema}'
          AND child_table.relname = '${tableName.tableName}';
      `;
      const queryRes = await db.sequelize.query(querySql, {
        type: 'SELECT',
      });

      return queryRes;
    };

    expect((await getParents()).length).toEqual(0);
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
