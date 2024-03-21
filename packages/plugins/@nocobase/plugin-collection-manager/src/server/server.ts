import { Filter, InheritedCollection, UniqueConstraintError } from '@nocobase/database';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import { Plugin } from '@nocobase/server';
import { Mutex } from 'async-mutex';
import lodash from 'lodash';
import path from 'path';
import * as process from 'process';
import { CollectionRepository } from '.';
import {
  afterCreateForForeignKeyField,
  afterCreateForReverseField,
  beforeCreateForReverseField,
  beforeDestroyForeignKey,
  beforeInitOptions,
} from './hooks';
import { beforeCreateForValidateField } from './hooks/beforeCreateForValidateField';
import { beforeCreateForViewCollection } from './hooks/beforeCreateForViewCollection';
import { CollectionModel, FieldModel } from './models';
import collectionActions from './resourcers/collections';
import sqlResourcer from './resourcers/sql';
import viewResourcer from './resourcers/views';

export class CollectionManagerPlugin extends Plugin {
  public schema: string;

  private loadFilter: Filter = {};

  setLoadFilter(filter: Filter) {
    this.loadFilter = filter;
  }

  async beforeLoad() {
    if (this.app.db.inDialect('postgres')) {
      this.schema = process.env.COLLECTION_MANAGER_SCHEMA || this.db.options.schema || 'public';
    }

    this.app.db.registerRepositories({
      CollectionRepository,
    });

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

    this.app.db.on('collections.beforeCreate', async (model) => {
      if (this.app.db.inDialect('postgres') && this.schema && model.get('from') != 'db2cm' && !model.get('schema')) {
        model.set('schema', this.schema);
      }
    });

    this.app.db.on('collections.beforeCreate', beforeCreateForViewCollection(this.db));

    this.app.db.on(
      'collections.afterCreateWithAssociations',
      async (model: CollectionModel, { context, transaction }) => {
        if (context) {
          await model.migrate({
            transaction,
          });
        }
      },
    );

    this.app.db.on('collections.beforeDestroy', async (model: CollectionModel, options) => {
      const removeOptions = {};
      if (options.transaction) {
        removeOptions['transaction'] = options.transaction;
      }

      const cascade = lodash.get(options, 'context.action.params.cascade', false);

      if (cascade === true || cascade === 'true') {
        removeOptions['cascade'] = true;
      }

      await model.remove(removeOptions);
    });

    // 要在 beforeInitOptions 之前处理
    this.app.db.on('fields.beforeCreate', beforeCreateForReverseField(this.app.db));

    this.app.db.on('fields.beforeCreate', async (model, options) => {
      const collectionName = model.get('collectionName');
      const collection = this.app.db.getCollection(collectionName);

      if (!collection) {
        return;
      }

      if (collection.isInherited() && (<InheritedCollection>collection).parentFields().has(model.get('name'))) {
        model.set('overriding', true);
      }
    });

    this.app.db.on('fields.beforeValidate', async (model) => {
      if (model.get('name') && model.get('name').includes('.')) {
        model.set('field', model.get('name'));
        model.set('name', model.get('name').replace(/\./g, '_'));
      }
    });

    this.app.db.on('fields.beforeCreate', async (model, options) => {
      if (model.get('source')) return;
      const type = model.get('type');
      const fn = beforeInitOptions[type];
      if (fn) {
        await fn(model, { database: this.app.db });
      }
    });

    this.app.db.on('fields.beforeCreate', beforeCreateForValidateField(this.app.db));

    this.app.db.on('fields.afterCreate', afterCreateForReverseField(this.app.db));

    this.app.db.on('fields.afterCreate', async (model: FieldModel, { context, transaction }) => {
      if (context) {
        await model.migrate({
          isNew: true,
          transaction,
        });
      }
    });

    // after migrate
    this.app.db.on('fields.afterCreate', afterCreateForForeignKeyField(this.app.db));

    this.app.db.on('fields.beforeUpdate', async (model, options) => {
      const newValue = options.values;
      if (
        model.get('reverseKey') &&
        lodash.get(newValue, 'reverseField') &&
        !lodash.get(newValue, 'reverseField.key')
      ) {
        const field = await this.app.db
          .getModel('fields')
          .findByPk(model.get('reverseKey'), { transaction: options.transaction });
        if (field) {
          throw new Error('cant update field without a reverseField key');
        }
      }
      // todo: 目前只支持一对多
      if (model.get('sortable') && model.get('type') === 'hasMany') {
        model.set('sortBy', model.get('foreignKey') + 'Sort');
      }
    });

    this.app.db.on('fields.afterUpdate', async (model: FieldModel, { context, transaction }) => {
      const prevOptions = model.previous('options');
      const currentOptions = model.get('options');

      if (context) {
        const prev = prevOptions['unique'];
        const next = currentOptions['unique'];

        if (Boolean(prev) !== Boolean(next)) {
          await model.syncUniqueIndex({ transaction });
        }
      }

      const prevDefaultValue = prevOptions['defaultValue'];
      const currentDefaultValue = currentOptions['defaultValue'];

      if (prevDefaultValue != currentDefaultValue) {
        await model.syncDefaultValue({ transaction, defaultValue: currentDefaultValue });
      }

      const prevOnDelete = prevOptions['onDelete'];
      const currentOnDelete = currentOptions['onDelete'];

      if (prevOnDelete != currentOnDelete) {
        await model.syncReferenceCheckOption({ transaction });
      }

      if (model.get('type') === 'hasMany' && model.get('sortable') && model.get('sortBy')) {
        await model.syncSortByField({ transaction });
      }
    });

    this.app.db.on('fields.afterSaveWithAssociations', async (model: FieldModel, { context, transaction }) => {
      if (context) {
        await model.load({ transaction });
      }
    });

    // before field remove
    this.app.db.on('fields.beforeDestroy', beforeDestroyForeignKey(this.app.db));

    const mutex = new Mutex();
    this.app.db.on('fields.beforeDestroy', async (model: FieldModel, options) => {
      await mutex.runExclusive(async () => {
        await model.remove(options);
      });
    });

    this.app.db.on('fields.afterDestroy', async (model: FieldModel, options) => {
      const { transaction } = options;
      const collectionName = model.get('collectionName');
      const childCollections = this.db.inheritanceMap.getChildren(collectionName);

      const childShouldRemoveField = Array.from(childCollections).filter((item) => {
        const parents = Array.from(this.db.inheritanceMap.getParents(item))
          .map((parent) => {
            const collection = this.db.getCollection(parent);
            const field = collection.getField(model.get('name'));
            return field;
          })
          .filter(Boolean);

        return parents.length == 0;
      });

      await this.db.getCollection('fields').repository.destroy({
        filter: {
          name: model.get('name'),
          collectionName: {
            $in: childShouldRemoveField,
          },
          options: {
            overriding: true,
          },
        },
        transaction,
      });
    });

    const loadCollections = async () => {
      this.log.debug('loading custom collections', { method: 'loadCollections' });
      this.app.setMaintainingMessage('loading custom collections');
      await this.app.db.getRepository<CollectionRepository>('collections').load({
        filter: this.loadFilter,
      });
    };

    this.app.on('beforeStart', loadCollections);

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

    this.app.acl.allow('collections', 'list', 'loggedIn');
    this.app.acl.allow('collectionCategories', 'list', 'loggedIn');
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, './collections'));
    this.db.getRepository<CollectionRepository>('collections').setApp(this.app);

    const errorHandlerPlugin = this.app.getPlugin<PluginErrorHandler>('error-handler');
    errorHandlerPlugin.errorHandler.register(
      (err) => {
        return err instanceof UniqueConstraintError;
      },
      (err, ctx) => {
        return ctx.throw(400, ctx.t(`The value of ${Object.keys(err.fields)} field duplicated`));
      },
    );

    this.app.resourcer.use(async (ctx, next) => {
      if (ctx.action.resourceName === 'collections.fields' && ['create', 'update'].includes(ctx.action.actionName)) {
        ctx.action.mergeParams({
          updateAssociationValues: ['reverseField'],
        });
      }
      await next();
    });

    this.app.resource(viewResourcer);
    this.app.resource(sqlResourcer);
    this.app.actions(collectionActions);

    const handleFieldSource = (fields) => {
      for (const field of lodash.castArray(fields)) {
        if (field.get('source')) {
          const [collectionSource, fieldSource] = field.get('source').split('.');
          // find original field
          const collectionField = this.app.db.getCollection(collectionSource)?.getField(fieldSource);

          if (!collectionField) {
            continue;
          }

          const newOptions = {};

          // write original field options
          lodash.merge(newOptions, lodash.omit(collectionField.options, 'name'));

          // merge with current field options
          lodash.mergeWith(newOptions, field.get(), (objValue, srcValue) => {
            if (srcValue === null) {
              return objValue;
            }
          });

          // set final options
          field.set('options', newOptions);
        }
      }
    };

    this.app.resourcer.use(async (ctx, next) => {
      await next();

      // handle collections:list
      if (
        ctx.action.resourceName === 'collections' &&
        ctx.action.actionName == 'list' &&
        ctx.action.params?.paginate == 'false'
      ) {
        for (const collection of ctx.body) {
          if (collection.get('view')) {
            const fields = collection.fields;
            handleFieldSource(fields);
          }
        }
      }

      //handle collections:fields:list
      if (ctx.action.resourceName == 'collections.fields' && ctx.action.actionName == 'list') {
        handleFieldSource(ctx.action.params?.paginate == 'false' ? ctx.body : ctx.body.rows);
      }

      if (ctx.action.resourceName == 'collections.fields' && ctx.action.actionName == 'get') {
        handleFieldSource(ctx.body);
      }
    });

    this.app.db.extendCollection({
      name: 'collectionCategory',
      dumpRules: 'required',
      origin: this.options.packageName,
    });
  }
  async install() {
    const dataSourcesCollection = this.app.db.getCollection('dataSources');

    if (dataSourcesCollection) {
      await dataSourcesCollection.repository.firstOrCreate({
        filterKeys: ['key'],
        values: {
          key: 'main',
          type: 'main',
          displayName: '{{t("Main")}}',
          fixed: true,
          options: {},
        },
      });
    }
  }
}

export default CollectionManagerPlugin;
