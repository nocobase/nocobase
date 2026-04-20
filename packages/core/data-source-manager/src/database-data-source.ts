/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { DatabaseIntrospector } from './database-introspector/database-introspector';
import { PostgresIntrospector } from './database-introspector/postgres-introspector';
import { MariaDBIntrospector } from './database-introspector/mariadb-introspector';
import { DataSource } from './data-source';
import { Context } from '@nocobase/actions';
import { CollectionOptions, FieldOptions } from './types';
import { SequelizeCollectionManager } from './sequelize-collection-manager';

export abstract class DatabaseDataSource<T extends DatabaseIntrospector = DatabaseIntrospector> extends DataSource {
  declare introspector: T;

  createDatabaseIntrospector(db: Database): T {
    if (db.isPostgresCompatibleDialect()) {
      return new PostgresIntrospector({
        db,
      }) as unknown as T;
    }
    const dialect = db.sequelize.getDialect();
    switch (dialect) {
      case 'mariadb':
        return new MariaDBIntrospector({
          db,
        }) as T;
      default:
        return new DatabaseIntrospector({
          db,
        }) as T;
    }
  }

  abstract readTables(): Promise<any>;
  abstract loadTables(ctx: Context, tables: string[]): Promise<any>;

  mergeWithLoadedCollections(
    collections: CollectionOptions[],
    loadedCollections: {
      [name: string]: { name: string; fields: FieldOptions[] };
    },
  ): CollectionOptions[] {
    return collections.map((collection) => {
      const loadedCollection = loadedCollections[collection.name];
      if (!loadedCollection) return collection;

      const collectionFields = collection.fields || [];
      const loadedFieldsByName = Object.fromEntries((loadedCollection.fields || []).map((f) => [f.name, f]));
      const loadedFieldsByColumn = (loadedCollection.fields || []).reduce<Record<string, FieldOptions[]>>(
        (result, field) => {
          const key = field.columnName || field.field || field.name;
          result[key] = result[key] || [];
          result[key].push(field);
          return result;
        },
        {},
      );
      const isAliasField = (field?: FieldOptions) => Boolean(field?.field && field.name !== field.field);

      // Merge existing fields
      const newFields = collectionFields.map((field) => {
        const loadedField =
          loadedFieldsByName[field.name] ||
          loadedFieldsByColumn[field.columnName || field.field || field.name]?.find(
            (candidate) => !isAliasField(candidate),
          ) ||
          loadedFieldsByColumn[field.columnName || field.field || field.name]?.[0];
        if (!loadedField) return field;
        if (loadedField.possibleTypes) {
          loadedField.possibleTypes = field.possibleTypes;
        }
        return this.mergeFieldOptions(field, loadedField);
      });

      // Preserve logical fields that reuse another physical column, such as
      // file collection `preview` -> `url`, because introspection cannot
      // reconstruct them from the physical table definition alone.
      const loadedMappedFields = (loadedCollection.fields || []).filter(
        (field) => isAliasField(field) && !newFields.find((newField) => newField.name === field.name),
      );

      newFields.push(...loadedMappedFields);

      // Add association fields from loaded data
      const loadedAssociationFields = (loadedCollection.fields || []).filter(
        (field) =>
          ['belongsTo', 'belongsToMany', 'hasMany', 'hasOne', 'belongsToArray'].includes(field.type) &&
          !newFields.find((newField) => newField.name === field.name),
      );

      newFields.push(...loadedAssociationFields);

      return {
        ...collection,
        ...Object.fromEntries(Object.entries(loadedCollection).filter(([key]) => key !== 'fields')),
        fields: newFields,
      };
    });
  }

  private mergeFieldOptions(fieldOptions: FieldOptions, modelOptions: FieldOptions): FieldOptions {
    const newOptions = {
      ...fieldOptions,
      ...modelOptions,
    };

    const incomingPossibleTypes = Array.isArray(fieldOptions.possibleTypes)
      ? fieldOptions.possibleTypes
      : fieldOptions.type
        ? [fieldOptions.type]
        : [];
    const hasCompatibleStorageType = this.hasCompatibleStorageType(fieldOptions.type, modelOptions.type);

    const shouldUseIncomingType =
      Boolean(fieldOptions.rawType) &&
      (modelOptions.rawType
        ? fieldOptions.rawType !== modelOptions.rawType && !hasCompatibleStorageType
        : !incomingPossibleTypes.includes(modelOptions.type) && !hasCompatibleStorageType);

    if (shouldUseIncomingType) {
      newOptions.type = fieldOptions.type;
      newOptions.interface = fieldOptions.interface;
      newOptions.rawType = fieldOptions.rawType;
    }

    for (const key of [...new Set([...Object.keys(modelOptions), ...Object.keys(fieldOptions)])]) {
      if (modelOptions[key] === null && fieldOptions[key]) {
        newOptions[key] = fieldOptions[key];
      }
    }

    return newOptions;
  }

  private hasCompatibleStorageType(incomingType?: string, loadedType?: string) {
    if (!incomingType || !loadedType || incomingType === loadedType) {
      return false;
    }

    const incomingStorageType = this.getFieldStorageType(incomingType);
    const loadedStorageType = this.getFieldStorageType(loadedType);

    if (!incomingStorageType || !loadedStorageType) {
      return false;
    }

    return incomingStorageType === loadedStorageType;
  }

  private getFieldStorageType(type?: string) {
    if (!type) {
      return;
    }

    const db = (this.collectionManager as SequelizeCollectionManager)?.db;
    if (!db) {
      return;
    }

    try {
      const fieldClass = db.fieldTypes.get(type);
      if (!fieldClass) {
        return;
      }

      const descriptor = Object.getOwnPropertyDescriptor(fieldClass.prototype, 'dataType');
      const collection = {
        name: '__sync_probe__',
        options: {
          underscored: false,
        },
        isView() {
          return false;
        },
      };
      const dataType = descriptor?.get?.call({
        options: {
          type,
        },
        database: db,
        collection,
        context: {
          database: db,
          collection,
        },
      });
      if (typeof dataType === 'string') {
        return dataType;
      }
      return dataType?.key || dataType?.constructor?.key || dataType?.constructor?.name;
    } catch {
      return;
    }
  }
}
