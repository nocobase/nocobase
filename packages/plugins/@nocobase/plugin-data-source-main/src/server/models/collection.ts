/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Collection, MagicAttributeModel, SyncOptions, Transactionable } from '@nocobase/database';
import lodash from 'lodash';
import { QueryInterfaceDropTableOptions } from 'sequelize';
import { FieldModel } from './field';

interface LoadOptions extends Transactionable {
  // TODO
  skipField?: boolean | Array<string>;
  skipExist?: boolean;
  resetFields?: boolean;
}

export class CollectionModel extends MagicAttributeModel {
  get db(): Database {
    return (<any>this.constructor).database;
  }

  toJSON() {
    const json = super.toJSON();

    const collection = this.db.getCollection(json.name);

    if (!json.filterTargetKey) {
      json.filterTargetKey = collection?.filterTargetKey;
    }

    if (collection && collection.unavailableActions) {
      json['unavailableActions'] = collection.unavailableActions();
    }

    // @ts-ignore
    if (collection && collection.availableActions) {
      // @ts-ignore
      json['availableActions'] = collection.availableActions();
    }

    return json;
  }

  async load(loadOptions: LoadOptions = {}) {
    const { skipExist, skipField, resetFields, transaction } = loadOptions;
    const name = this.get('name');

    let collection: Collection;

    const collectionOptions = {
      origin: '@nocobase/plugin-data-source-main',
      ...this.get(),
      fields: [],
      loadedFromCollectionManager: true,
    };

    if (!this.db.inDialect('postgres') && collectionOptions.schema) {
      delete collectionOptions.schema;
    }

    if (this.db.inDialect('postgres') && !collectionOptions.schema && collectionOptions.from !== 'db2cm') {
      collectionOptions.schema = process.env.COLLECTION_MANAGER_SCHEMA || this.db.options.schema || 'public';
    }

    if (this.db.hasCollection(name)) {
      collection = this.db.getCollection(name);

      if (skipExist) {
        return collection;
      }

      if (resetFields) {
        collection.resetFields();
      }

      collection.updateOptions(collectionOptions);
    } else {
      if (!collectionOptions.dumpRules) {
        lodash.set(collectionOptions, 'dumpRules.group', 'custom');
      }

      collection = this.db.collection(collectionOptions);
    }

    if (!skipField) {
      await this.loadFields({ transaction });
    }

    if (lodash.isArray(skipField)) {
      await this.loadFields({ transaction, skipField });
    }

    await this.db.emitAsync('collection:loaded', {
      collection,
      transaction,
    });

    return collection;
  }

  async loadFields(
    options: Transactionable & {
      skipField?: Array<string>;
      includeFields?: Array<string>;
    } = {},
  ) {
    let fields = this.get('fields') || [];

    if (!fields.length) {
      fields = await this.getFields(options);
    }

    if (options.skipField) {
      fields = fields.filter((field) => !options.skipField.includes(field.name));
    }

    if (options.includeFields) {
      fields = fields.filter((field) => options.includeFields.includes(field.name));
    }

    if (this.options.view && fields.find((f) => f.name == 'id')) {
      // set id field to primary key, other primary key to false
      fields = fields.map((field) => {
        if (field.name == 'id') {
          field.set('primaryKey', true);
        } else {
          field.set('primaryKey', false);
        }
        return field;
      });
    }

    // @ts-ignore
    const instances: FieldModel[] = fields;

    instances.sort((a, b) => {
      if (a.isAssociationField() && !b.isAssociationField()) {
        return 1;
      }
      if (!a.isAssociationField() && b.isAssociationField()) {
        return -1;
      }
      return 0;
    });

    for (const instance of instances) {
      await instance.load(options);
    }
  }

  async remove(options?: Transactionable & QueryInterfaceDropTableOptions) {
    const { transaction } = options || {};
    const name = this.get('name');
    const collection = this.db.getCollection(name);

    if (!collection) {
      return;
    }

    const fields = await this.db.getRepository('fields').find({
      filter: {
        'type.$in': ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'],
      },
      transaction,
    });

    for (const field of fields) {
      if (field.get('target') && field.get('target') === name) {
        await field.destroy({ transaction });
      } else if (field.get('through') && field.get('through') === name) {
        await field.destroy({ transaction });
      }

      if (field.get('collectionName') === name) {
        await field.destroy({ transaction });
      }
    }

    await collection.removeFromDb(options);
  }

  async migrate(options?: SyncOptions & Transactionable) {
    const pendingFieldsTargetToThis = this.db.pendingFields.get(this.get('name')) || [];
    const getPendingField = () =>
      pendingFieldsTargetToThis.map((field) => {
        return {
          name: field.get('name'),
          collectionName: field.get('collectionName'),
        };
      });

    const beforePendingFields = getPendingField();

    const collection = await this.load({
      transaction: options?.transaction,
    });

    const afterPendingFields = getPendingField();

    const resolvedPendingFields = lodash.differenceWith(beforePendingFields, afterPendingFields, lodash.isEqual);
    const resolvedPendingFieldsCollections = lodash.uniq(resolvedPendingFields.map((field) => field.collectionName));

    // postgres support zero column table, other database should not sync it to database
    // @ts-ignore
    if (Object.keys(collection.model.tableAttributes).length == 0 && !this.db.inDialect('postgres')) {
      return;
    }

    try {
      const syncOptions = {
        force: false,
        alter: {
          drop: false,
        },
        ...options,
      };

      await collection.sync(syncOptions);

      for (const collectionName of resolvedPendingFieldsCollections) {
        await this.db.getCollection(collectionName).sync(syncOptions);
      }
    } catch (error) {
      console.error(error);
      const name = this.get('name');
      this.db.removeCollection(name);
      throw error;
    }
  }
}
