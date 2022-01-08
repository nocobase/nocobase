import { MockServer, mockServer } from '@nocobase/test';
import { Collection, Database } from '@nocobase/database';
import PluginUiSchema from '../server';
import { uid } from '@nocobase/utils';

describe('ui_schemas', () => {
  let app: MockServer;
  let db: Database;
  let Field: Collection;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    db = app.db;

    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.dropAllTables();

    app.plugin(PluginUiSchema);

    await app.load();

    Field = db.collection({
      name: 'fields',
      fields: [
        {
          type: 'belongsTo',
          name: 'uiSchema',
          target: 'ui_schemas',
          foreignKey: 'uiSchemaUid',
          targetKey: 'x-uid',
        },
      ],
    });

    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('create', () => {
    test('create', async () => {
      // db.on('ui_schemas.afterCreate', (model) => {
      //   console.log(model.get());
      // });
      const id = uid();
      await Field.repository.create({
        values: {
          uiSchema: {
            'x-uid': id,
            name: 'aa',
            properties: {
              a: 'a',
            },
          },
        },
        updateAssociationValues: ['uiSchema'],
      });
      console.log(id);
    });
  });

  describe('update', () => {
    let field;
    beforeEach(async () => {
      field = await Field.repository.create({
        values: {
          uiSchema: {
            'x-uid': uid(),
            name: 'abc',
            'x-component-props': {
              b: 'b1',
            },
            properties: {
              a: 'abc',
            },
          },
        },
        updateAssociationValues: ['uiSchema'],
      });
    });

    test('field repository update', async () => {
      db.on('ui_schemas.beforeUpdate', (model) => {
        model.set({ ...model.get() });
        // console.log(model, model.get());
      });
      db.on('ui_schemas.afterUpdate', (model) => {
        console.log(model.dataValues);
      });
      // 数据库里的并没有被修改
      await Field.repository.update({
        filterByTk: field.id,
        updateAssociationValues: ['uiSchema'],
        values: {
          uiSchema: {
            'x-uid': field.uiSchemaUid,
            name: 'aabbcc',
            'x-component-props': {
              b: 'b2',
            },
            properties: {
              a: 'aabbcc',
            },
          },
        },
      });

      const UISchema = db.getCollection('ui_schemas');
      const s = await UISchema.model.findByPk(field.uiSchemaUid);

      expect(s.toJSON()).toMatchObject({
        name: 'aabbcc',
        'x-component-props': {
          b: 'b2',
        },
        properties: {
          a: 'aabbcc',
        },
      });
    });
  });

  describe('uiSchema', () => {
    test('uiSchema model update', async () => {
      const UISchema = db.getCollection('ui_schemas');
      const id = uid();
      const schema = await UISchema.model.create({
        'x-uid': id,
        name: 'abc',
        'x-component-props': {
          b: 'b1',
        },
        properties: {
          a: 'abc',
        },
      });

      await schema.update({
        name: 'aabbcc',
        'x-component-props': {
          b: 'b2',
        },
        properties: {
          a: 'aabbcc',
        },
      });

      const s = await UISchema.model.findByPk(id);

      expect(s.toJSON()).toMatchObject({
        name: 'aabbcc',
        'x-component-props': {
          b: 'b2',
        },
        properties: {
          a: 'aabbcc',
        },
      });
    });

    test('uiSchema repository update', async () => {
      const UISchema = db.getCollection('ui_schemas');
      const id = uid();
      await UISchema.repository.create({
        values: {
          'x-uid': id,
          name: 'abc',
          'x-component-props': {
            b: 'b1',
          },
          properties: {
            a: 'abc',
          },
        },
      });

      await UISchema.repository.update({
        filterByTk: id,
        values: {
          name: 'aabbcc',
          'x-component-props': {
            b: 'b2',
          },
          properties: {
            a: 'aabbcc',
          },
        },
      });

      const s = await UISchema.model.findByPk(id);

      expect(s.toJSON()).toMatchObject({
        name: 'aabbcc',
        'x-component-props': {
          b: 'b2',
        },
        properties: {
          a: 'aabbcc',
        },
      });
    });
  });
});
