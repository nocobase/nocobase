import path from 'path';
import { Plugin } from '@nocobase/server';
import { registerModels, Table, uid } from '@nocobase/database';
import * as models from './models';
import { createOrUpdate, findAll } from './actions';
import { create } from './actions/fields';

registerModels(models);

export default {
  name: 'collections',
  async load(this: Plugin) {
    const database = this.app.db;

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.on('beforeStart', async () => {
      await database.getModel('collections').load({
        skipExisting: true,
      });
    });

    this.app.on('db.init', async () => {
      const tableNames = ['users', 'applications'];
      const Collection = database.getModel('collections');
      for (const tableName of tableNames) {
        const table = database.getTable(tableName);
        if (!table) {
          continue;
        }
        const config = table.getOptions();
        const collection = await Collection.create(config);
        // 把当前系统排序字段，排除掉，不写入fields表
        const fields = config.fields?.filter((field) => field.type !== 'sort');
        await collection.updateAssociations({
          generalFields: config.fields.filter((field) => field.state !== 0),
          systemFields: config.fields.filter((field) => field.state === 0),
        });
        // await collection.migrate();
      }
    });

    const [Collection, Field] = database.getModels(['collections', 'fields']);

    database.on('fields.beforeCreate', async (model) => {
      if (!model.get('name')) {
        model.set('name', model.get('key'));
      }
      if (!model.get('collection_name') && model.get('parentKey')) {
        const field = await Field.findByPk(model.get('parentKey'));
        if (field) {
          const { target } = field.get('options') || {};
          if (target) {
            model.set('collection_name', target);
          }
        }
      }
    });

    database.on('fields.beforeUpdate', async (model) => {
      console.log('beforeUpdate', model.key);
      if (!model.get('collection_name') && model.get('parentKey')) {
        const field = await Field.findByPk(model.get('parentKey'));
        if (field) {
          const { target } = field.get('options') || {};
          if (target) {
            model.set('collection_name', target);
          }
        }
      }
    });

    database.on('fields.afterCreate', async (model) => {
      console.log('afterCreate', model.key, model.get('collection_name'));
      if (model.get('interface') !== 'subTable') {
        return;
      }
      const { target } = model.get('options') || {};
      // const uiSchemaKey = model.get('ui_schema_key');
      // console.log({ uiSchemaKey })
      try {
        let collection = await Collection.findOne({
          where: {
            name: target,
          },
        });
        if (!collection) {
          collection = await Collection.create({
            name: target,
            // ui_schema_key: uiSchemaKey,
          });
        }
        await collection.migrate();
      } catch (error) {
        throw error;
      }
    });

    database.on('fields.afterUpdate', async (model) => {
      console.log('afterUpdate');
      if (model.get('interface') !== 'subTable') {
        return;
      }
      const { target } = model.get('options') || {};
      try {
        let collection = await Collection.findOne({
          where: {
            name: target,
          },
        });
        if (!collection) {
          collection = await Collection.create({
            name: target,
          });
        }
        // if (model.get('ui_schema_key')) {
        //   collection.set('ui_schema_key', model.get('ui_schema_key'));
        //   await collection.save({ hooks: false });
        // }
        await collection.migrate();
      } catch (error) {
        throw error;
      }
    });

    this.app.resourcer.registerActionHandler('collections.fields:create', create);
    this.app.resourcer.registerActionHandler('collections:findAll', findAll);
    this.app.resourcer.registerActionHandler('collections:createOrUpdate', createOrUpdate);
    this.app.resourcer.registerActionHandler('fields:create', create);
    this.app.resourcer.registerActionHandler('collections:create', createOrUpdate);
  },
};
