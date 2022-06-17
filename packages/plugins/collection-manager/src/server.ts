import { Collection } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import lodash from 'lodash';
import path from 'path';
import { CollectionRepository } from '.';
import {
  afterCreateForReverseField,
  beforeCreateForChildrenCollection,
  beforeCreateForReverseField,
  beforeInitOptions
} from './hooks';
import { CollectionModel, FieldModel } from './models';

export class CollectionManagerPlugin extends Plugin {
  async beforeLoad() {
    this.app.db.registerModels({
      CollectionModel,
      FieldModel,
    });

    this.db.addMigrations({
      namespace: 'collection-manager',
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.db.registerRepositories({
      CollectionRepository,
    });

    this.app.db.on('fields.beforeUpdate', async (model, options) => {
      const newValue = options.values;
      if (
        model.get('reverseKey') &&
        lodash.get(newValue, 'reverseField') &&
        !lodash.get(newValue, 'reverseField.key')
      ) {
        throw new Error('cant update field without a reverseField key');
      }
    });

    // 要在 beforeInitOptions 之前处理
    this.app.db.on('fields.beforeCreate', beforeCreateForReverseField(this.app.db));
    this.app.db.on('fields.beforeCreate', beforeCreateForChildrenCollection(this.app.db));
    this.app.db.on('fields.beforeCreate', async (model, options) => {
      const type = model.get('type');
      await this.app.db.emitAsync(`fields.${type}.beforeInitOptions`, model, {
        ...options,
        database: this.app.db,
      });
    });
    for (const key in beforeInitOptions) {
      if (Object.prototype.hasOwnProperty.call(beforeInitOptions, key)) {
        const fn = beforeInitOptions[key];
        this.app.db.on(`fields.${key}.beforeInitOptions`, fn);
      }
    }
    this.app.db.on('fields.afterCreate', afterCreateForReverseField(this.app.db));

    this.app.db.on('collections.afterCreateWithAssociations', async (model, { context, transaction }) => {
      if (context) {
        await model.migrate({ transaction });
      }
    });

    this.app.db.on('fields.afterCreate', async (model, { context, transaction }) => {
      if (context) {
        await model.migrate({ transaction });
      }
    });

    this.app.db.on('fields.afterCreateWithAssociations', async (model, { context, transaction }) => {
      if (context) {
        await model.load({ transaction });
      }
    });

    this.app.db.on('fields.afterDestroy', async (model, options) => {
      await model.remove(options);
    });

    this.app.db.on('collections.afterDestroy', async (model, options) => {
      await model.remove(options);
    });

    this.app.on('beforeStart', async () => {
      await this.app.db.getRepository<CollectionRepository>('collections').load();
    });

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'collections.fields' && actionName === 'update') {
        const { updateAssociationValues = [] } = ctx.action.params;
        updateAssociationValues.push('uiSchema');
        ctx.action.mergeParams({
          updateAssociationValues,
        });
      }
      await next();
    });

    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (actionName === 'update') {
        const { updateAssociationValues = [] } = ctx.action.params;
        const [collectionName, associationName] = resourceName.split('.');
        if (!associationName) {
          const collection: Collection = ctx.db.getCollection(collectionName);
          if (collection) {
            for (const [, field] of collection.fields) {
              if (['subTable', 'o2m'].includes(field.options.interface)) {
                updateAssociationValues.push(field.name);
              }
            }
          }
        } else {
          const association = ctx.db.getCollection(collectionName)?.getField?.(associationName);
          if (association?.target) {
            const collection: Collection = ctx.db.getCollection(association?.target);
            if (collection) {
              for (const [, field] of collection.fields) {
                if (['subTable', 'o2m'].includes(field.options.interface)) {
                  updateAssociationValues.push(field.name);
                }
              }
            }
          }
        }
        if (updateAssociationValues.length) {
          ctx.action.mergeParams({
            updateAssociationValues,
          });
        }
      }
      await next();
    });

    this.app.acl.allow('collections', 'list', 'loggedIn');
    this.app.acl.allow('collections', ['create', 'update', 'destroy'], 'allowConfigure');
  }

  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default CollectionManagerPlugin;
