import path from 'path';
import { Application } from '@nocobase/server';
import { registerModels, Table, uid } from '@nocobase/database';
import * as models from './models';
import { createOrUpdate, findAll } from './actions';
import { create } from './actions/fields';

export default async function (this: Application, options = {}) {
  const database = this.db;

  registerModels(models);

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  this.on('afterLoadPlugins', async () => {
    await database.getModel('collections').load();
  });

  this.on('db.init', async () => {
    const userTable = database.getTable('users');
    const config = userTable.getOptions();
    const Collection = database.getModel('collections');
    const collection = await Collection.create(config);
    await collection.updateAssociations({
      generalFields: config.fields.filter((field) => field.state !== 0),
      systemFields: config.fields.filter((field) => field.state === 0),
    });
    await collection.migrate();
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
      // if (model.get('ui_schema_key')) {
      //   collection.set('ui_schema_key', model.get('ui_schema_key'));
      //   await collection.save({ hooks: false });
      // }
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

  this.resourcer.registerActionHandler('collections.fields:create', create);
  this.resourcer.registerActionHandler('collections:findAll', findAll);
  this.resourcer.registerActionHandler('collections:createOrUpdate', createOrUpdate);
}
