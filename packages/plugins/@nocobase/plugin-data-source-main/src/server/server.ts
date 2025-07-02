/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  extractTypeFromDefinition,
  fieldTypeMap,
  Filter,
  InheritedCollection,
  UniqueConstraintError,
} from '@nocobase/database';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import { Plugin } from '@nocobase/server';
import lodash from 'lodash';
import path from 'path';
import { CollectionRepository } from '.';
import { FieldIsDependedOnByOtherError } from './errors/field-is-depended-on-by-other';
import { FieldNameExistsError } from './errors/field-name-exists-error';
import {
  afterCreateForForeignKeyField,
  afterCreateForReverseField,
  beforeCreateForReverseField,
  beforeDestroyForeignKey,
  beforeInitOptions,
} from './hooks';
import { beforeCreateCheckFieldInMySQL } from './hooks/beforeCreateCheckFieldInMySQL';
import { beforeCreateForValidateField, beforeUpdateForValidateField } from './hooks/beforeCreateForValidateField';
import { beforeCreateForViewCollection } from './hooks/beforeCreateForViewCollection';
import { beforeDestoryField } from './hooks/beforeDestoryField';
import { CollectionModel, FieldModel } from './models';
import collectionActions from './resourcers/collections';
import viewResourcer from './resourcers/views';
import { TableInfo } from 'packages/core/database/src/query-interface/query-interface';
import { ColumnsDescription } from 'sequelize';

export class PluginDataSourceMainServer extends Plugin {
  private loadFilter: Filter = {};

  setLoadFilter(filter: Filter) {
    this.loadFilter = filter;
  }

  async handleSyncMessage(message) {
    const { type, collectionName } = message;

    if (type === 'syncCollection') {
      const collectionModel: CollectionModel = await this.app.db.getCollection('collections').repository.findOne({
        filter: {
          name: collectionName,
        },
      });

      await collectionModel.load();
    }

    if (type === 'removeField') {
      const { collectionName, fieldName } = message;
      const collection = this.app.db.getCollection(collectionName);
      if (!collection) {
        return;
      }

      return collection.removeFieldFromDb(fieldName);
    }

    if (type === 'removeCollection') {
      const { collectionName } = message;
      const collection = this.app.db.getCollection(collectionName);
      if (!collection) {
        return;
      }

      collection.remove();
    }
  }

  async beforeLoad() {
    this.app.db.registerRepositories({
      CollectionRepository,
    });

    this.app.db.registerModels({
      CollectionModel,
      FieldModel,
    });

    this.db.addMigrations({
      namespace: 'data-source-main',
      directory: path.resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.db.on('collections.beforeCreate', beforeCreateForViewCollection(this.db));

    this.app.db.on('collections.beforeCreate', async (model: CollectionModel, options) => {
      if (this.app.db.getCollection(model.get('name')) && model.get('from') !== 'db2cm' && !model.get('isThrough')) {
        throw new Error(`Collection named ${model.get('name')} already exists`);
      }
    });

    this.app.db.on(
      'collections.afterSaveWithAssociations',
      async (model: CollectionModel, { context, transaction }) => {
        if (context) {
          await model.migrate({
            transaction,
          });

          this.sendSyncMessage(
            {
              type: 'syncCollection',
              collectionName: model.get('name'),
            },
            {
              transaction,
            },
          );
        }
      },
    );

    this.app.db.on('collections.beforeDestroy', async (model: CollectionModel, options) => {
      const removeOptions = {};
      if (options.transaction) {
        removeOptions['transaction'] = options.transaction;
      }

      const cascade = options.cascade || lodash.get(options, 'context.action.params.cascade', false);

      if (cascade === true || cascade === 'true') {
        removeOptions['cascade'] = true;
      }

      await model.remove(removeOptions);

      this.sendSyncMessage(
        {
          type: 'removeCollection',
          collectionName: model.get('name'),
        },
        {
          transaction: options.transaction,
        },
      );
    });

    // 要在 beforeInitOptions 之前处理
    this.app.db.on('fields.beforeCreate', beforeCreateCheckFieldInMySQL(this.app.db));

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

    this.app.db.on('fields.beforeCreate', async (model: FieldModel, options) => {
      const { transaction } = options;
      // validate field name
      const collectionName = model.get('collectionName');
      const name = model.get('name');

      if (!collectionName || !name) {
        return;
      }

      const exists = await this.app.db.getRepository('fields').findOne({
        filter: {
          collectionName,
          name,
        },
        transaction,
      });

      if (exists) {
        throw new FieldNameExistsError(name, collectionName);
      }
    });

    this.app.db.on('fields.beforeUpdate', beforeUpdateForValidateField(this.app.db));

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

    const afterCreateForForeignKeyFieldHook = afterCreateForForeignKeyField(this.app.db);

    this.app.db.on('fields.afterCreate', async (model: FieldModel, options) => {
      const { context, transaction } = options;
      if (context) {
        await model.load({ transaction });
        await afterCreateForForeignKeyFieldHook(model, options);
      }
    });

    this.app.db.on('fields.afterUpdate', async (model: FieldModel, options) => {
      const { context, transaction } = options;
      if (context) {
        await model.load({ transaction });
      }
    });

    this.app.db.on('fields.afterSaveWithAssociations', async (model: FieldModel, options) => {
      const { context, transaction } = options;
      if (context) {
        const collection = this.app.db.getCollection(model.get('collectionName'));
        const syncOptions = {
          transaction,
          force: false,
          alter: {
            drop: false,
          },
        };

        await collection.sync(syncOptions);

        this.sendSyncMessage(
          {
            type: 'syncCollection',
            collectionName: model.get('collectionName'),
          },
          {
            transaction,
          },
        );
      }
    });

    // before field remove
    this.app.db.on('fields.beforeDestroy', beforeDestoryField(this.app.db));
    this.app.db.on('fields.beforeDestroy', beforeDestroyForeignKey(this.app.db));

    this.app.db.on('fields.beforeDestroy', async (model: FieldModel, options) => {
      const lockKey = `${this.name}:fields.beforeDestroy:${model.get('collectionName')}`;
      await this.app.lockManager.runExclusive(lockKey, async () => {
        await model.remove(options);

        this.sendSyncMessage(
          {
            type: 'removeField',
            collectionName: model.get('collectionName'),
            fieldName: model.get('name'),
          },
          {
            transaction: options.transaction,
          },
        );
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

    this.app.resourceManager.use(async function pushUISchemaWhenUpdateCollectionField(ctx, next) {
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
    this.app.resourceManager.use(async function pushUISchemaWhenUpdateCollectionField(ctx, next) {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'collections' && actionName === 'create') {
        const { values } = ctx.action.params;
        const keys = Object.keys(values);
        const presetKeys = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
        for (const presetKey of presetKeys) {
          if (keys.includes(presetKey)) {
            continue;
          }
          values[presetKey] = !!values.fields?.find((v) => v.name === presetKey);
        }
        ctx.action.mergeParams({
          values,
        });
      }
      await next();
    });
    this.app.acl.allow('collections', 'list', 'loggedIn');
    this.app.acl.allow('collections', 'listMeta', 'loggedIn');
    this.app.acl.allow('collectionCategories', 'list', 'loggedIn');

    this.app.acl.registerSnippet({
      name: `pm.data-source-manager.data-source-main`,
      actions: ['collections:*', 'collections.fields:*', 'collectionCategories:*'],
    });

    this.app.acl.registerSnippet({
      name: `pm.data-source-manager.collection-view `,
      actions: ['dbViews:*'],
    });
  }

  async load() {
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

    errorHandlerPlugin.errorHandler.register(
      (err) => err instanceof FieldIsDependedOnByOtherError,
      (err, ctx) => {
        ctx.status = 400;
        ctx.body = {
          errors: [
            {
              message: ctx.i18n.t('field-is-depended-on-by-other', {
                fieldName: err.options.fieldName,
                fieldCollectionName: err.options.fieldCollectionName,
                dependedFieldName: err.options.dependedFieldName,
                dependedFieldCollectionName: err.options.dependedFieldCollectionName,
                dependedFieldAs: err.options.dependedFieldAs,
                ns: 'data-source-main',
              }),
            },
          ],
        };
      },
    );

    errorHandlerPlugin.errorHandler.register(
      (err) => err instanceof FieldNameExistsError,
      (err, ctx) => {
        ctx.status = 400;

        ctx.body = {
          errors: [
            {
              message: ctx.i18n.t('field-name-exists', {
                name: err.value,
                collectionName: err.collectionName,
                ns: 'data-source-main',
              }),
            },
          ],
        };
      },
    );

    this.app.resourceManager.use(async function mergeReverseFieldWhenSaveCollectionField(ctx, next) {
      if (ctx.action.resourceName === 'collections.fields' && ['create', 'update'].includes(ctx.action.actionName)) {
        ctx.action.mergeParams({
          updateAssociationValues: ['reverseField'],
        });
      }
      await next();
    });

    this.app.resource(viewResourcer);
    this.app.actions(collectionActions);

    const handleFieldSource = (fields, rawFields?: ColumnsDescription) => {
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
        const fieldTypes = fieldTypeMap[this.db.options.dialect];
        if (rawFields && fieldTypes) {
          const rawField = rawFields[field.get('name')];
          const mappedType = extractTypeFromDefinition(rawField.type);
          const possibleTypes = fieldTypes[mappedType];
          field.set('possibleTypes', possibleTypes);
        }
      }
    };

    this.app.resourceManager.use(async function handleFieldSourceMiddleware(ctx, next) {
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
        const collectionName = ctx.action.params?.associatedIndex;
        let rawFields: ColumnsDescription = {};
        if (collectionName) {
          const tableInfo: TableInfo = {
            tableName: collectionName,
          };

          if (ctx.app.db.options.schema) {
            tableInfo.schema = ctx.app.db.options.schema;
          }
          rawFields = await ctx.app.db.queryInterface.sequelizeQueryInterface.describeTable(tableInfo);
        }
        handleFieldSource(ctx.action.params?.paginate == 'false' ? ctx.body : ctx.body.rows, rawFields);
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

export default PluginDataSourceMainServer;
