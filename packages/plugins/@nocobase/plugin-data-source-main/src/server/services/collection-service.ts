/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getInterfaceTypeMapByDialect } from '@nocobase/data-source-manager';
import Database, { CollectionOptions, fieldTypeMap } from '@nocobase/database';
import _ from 'lodash';

type PartialCollectionOptions = Partial<
  Omit<CollectionOptions, 'fields'> & {
    fields?: Partial<FieldOptions>[];
  }
>;

interface ColumnDescription {
  type: string;
  allowNull: boolean;
  defaultValue: string;
  primaryKey: boolean;
  autoIncrement: boolean;
  comment: string | null;
}

interface ColumnsDescription {
  [key: string]: ColumnDescription;
}

interface UnsupportedFieldOptions {
  rawType: string;
  name: string;
  supported: false;
}

type FieldInferResult = FieldOptions | UnsupportedFieldOptions;

interface FieldOptions {
  name: string;
  field: string;
  rawType: string;
  type: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
  possibleTypes?: string[];
  defaultValue?: any;
  primaryKey: boolean;
  unique: boolean;
  allowNull?: boolean;
  autoIncrement?: boolean;
}

export class CollectionService {
  constructor(private db: Database) {}

  async addCollections(collectionNames: string[]) {
    const results = (
      await Promise.all(
        collectionNames.map(async (tableName) => {
          const tableInfo: { tableName: string; schema?: string } = { tableName };

          if (this.db.options.schema) {
            tableInfo.schema = this.db.options.schema;
          }

          try {
            return await this.getCollection(tableInfo);
          } catch (e) {
            if (e.message.includes('No description found for')) {
              this.db.logger.debug('Table description not found', {
                tableName,
                error: e.message,
              });
              return false;
            }

            this.db.logger.error('Failed to get collection', {
              tableName,
              error: e.message,
              stack: e.stack,
            });
            throw e;
          }
        }),
      )
    ).filter(Boolean) as Array<CollectionOptions>;
    try {
      await this.db.getRepository('collections').create({ values: results });
    } catch (e) {
      this.db.logger.error('Failed to add collections', {
        error: e.message,
        stack: e.stack,
      });
      throw new Error(`Failed to add collections: ${e.message}`, { cause: e });
    }
  }

  async getCollection(tableInfo: { tableName: string; schema?: string }): Promise<CollectionOptions> {
    const columnsInfo = await this.db.sequelize.getQueryInterface().describeTable(tableInfo);

    const constraints = await this.db.sequelize.getQueryInterface().showIndex(tableInfo.tableName);
    const collectionOptions = this.tableInfoToCollectionOptions(tableInfo);

    try {
      const fields: Array<FieldInferResult> = Object.keys(columnsInfo).map((columnName) => {
        return this.columnInfoToFieldOptions(columnsInfo, columnName, constraints);
      });

      const unsupportedFields: Array<UnsupportedFieldOptions> = fields.filter((field) => {
        // @ts-ignore
        return field.supported === false;
      }) as Array<UnsupportedFieldOptions>;

      const supportFields: Array<FieldOptions> = fields.filter((field) => {
        // @ts-ignore
        return field.supported !== false;
      }) as Array<FieldOptions>;

      this.db.logger.debug('Processing collection fields', {
        tableName: tableInfo.tableName,
        totalFields: fields.length,
        supportedFields: supportFields.length,
        unsupportedFields: unsupportedFields.length,
      });

      const remoteCollectionInfo: CollectionOptions = {
        ...collectionOptions,
        ...this.collectionOptionsByFields(supportFields),
        fields: supportFields,
      };

      if (unsupportedFields.length) {
        remoteCollectionInfo.unsupportedFields = unsupportedFields;
        this.db.logger.debug('Found unsupported fields', {
          tableName: tableInfo.tableName,
          fields: unsupportedFields.map((f) => ({ name: f.name, type: f.rawType })),
        });
      }

      if (
        remoteCollectionInfo.view &&
        !remoteCollectionInfo.filterTargetKey &&
        supportFields.find((field) => field.name === 'id')
      ) {
        remoteCollectionInfo.filterTargetKey = 'id';
        this.db.logger.debug('Set view filterTargetKey to id', {
          tableName: tableInfo.tableName,
        });
      }

      return remoteCollectionInfo;
    } catch (e) {
      this.db.logger.error('Collection introspection error', {
        tableName: tableInfo.tableName,
        error: e.message,
        stack: e.stack,
      });
      throw new Error(`table ${tableInfo.tableName} introspection error: ${e.message}`, { cause: e });
    }
  }

  public tableInfoToCollectionOptions(tableInfo: { tableName: string; schema?: string }): CollectionOptions {
    const tableName = tableInfo.tableName;
    //replace dot to underscore
    const name = tableName.replace(/\./g, '_');

    return {
      name,
      title: name,
      schema: tableInfo.schema,
      tableName,
    };
  }

  private collectionOptionsByFields(fields: FieldOptions[]): PartialCollectionOptions {
    const options: PartialCollectionOptions = {
      timestamps: false,
      autoGenId: false,
    };

    const autoIncrementField = fields.find((field) => field.autoIncrement);

    if (autoIncrementField) {
      options.filterTargetKey = autoIncrementField.name;
    }

    const primaryKeys = fields.filter((field) => field.primaryKey);

    if (primaryKeys.length > 1) {
      options.filterTargetKey = primaryKeys.map((field) => field.name);
    }

    if (!options.filterTargetKey && primaryKeys.length == 1) {
      options.filterTargetKey = primaryKeys[0].name;
    }

    const uniques = fields.filter((field) => field.unique);

    if (!options.filterTargetKey && uniques.length == 1) {
      options.filterTargetKey = uniques[0].name;
    }

    return options;
  }

  protected columnInfoToFieldOptions(
    columnsInfo: ColumnsDescription,
    columnName: string,
    indexes: any,
  ): FieldInferResult {
    const columnInfo = columnsInfo[columnName];

    let fieldOptions: FieldOptions = {
      ...this.columnAttribute(columnsInfo, columnName, indexes),
      ...this.inferFieldTypeByRawType(columnInfo.type),
      rawType: columnInfo.type,
      name: columnName,
      field: columnName,
    };

    Object.assign(fieldOptions, this.inferFieldOptionsByRawType(fieldOptions.type, columnInfo.type));

    if (!fieldOptions.type) {
      return {
        rawType: columnInfo.type,
        name: columnName,
        supported: false,
      };
    }

    const interfaceConfig = this.getDefaultInterfaceByType(columnsInfo, columnName, fieldOptions.type);

    if (typeof interfaceConfig === 'string') {
      fieldOptions.interface = interfaceConfig;
    } else {
      fieldOptions = {
        ...fieldOptions,
        ...interfaceConfig,
      };
    }

    _.set(fieldOptions, 'uiSchema.title', columnName);

    return fieldOptions;
  }

  protected inferFieldOptionsByRawType(type: string, rawType: string) {
    const fieldClass = this.db.fieldTypes.get(type);

    if (!fieldClass) {
      return {};
    }

    if (typeof fieldClass.optionsFromRawType === 'function') {
      return fieldClass.optionsFromRawType(rawType);
    }

    return {};
  }

  private getDefaultInterfaceByType(columnsInfo, columnName, type: string): object | string {
    const typeInterfaceMap = getInterfaceTypeMapByDialect(this.db.sequelize.getDialect());
    const interfaceConfig = typeInterfaceMap[type];

    let interfaceRes = interfaceConfig;
    if (typeof interfaceConfig === 'function') {
      interfaceRes = interfaceConfig(columnsInfo[columnName]);
    }

    return interfaceRes;
  }

  protected columnAttribute(columnsInfo: ColumnsDescription, columnName: string, indexes: any) {
    const columnInfo = columnsInfo[columnName];

    const attr: any = {
      type: columnInfo.type,
      allowNull: columnInfo.defaultValue ? true : columnInfo.allowNull,
      primaryKey: columnInfo.primaryKey,
      unique: false,
      description: columnInfo.comment,
    };

    if (columnInfo.defaultValue && typeof columnInfo.defaultValue === 'string') {
      const isSerial = columnInfo.defaultValue.match(/^nextval\(/);
      const isUUID = columnInfo.defaultValue.match(/^uuid_generate_v4\(/);

      if (isSerial || isUUID) {
        attr.autoIncrement = true;
      }
    }

    if (columnInfo.type === 'ARRAY') {
      attr.dataType = 'array';
      if (columnInfo['elementType']) {
        const { type } = this.inferFieldTypeByRawType(columnInfo['elementType']);
        attr.elementType = type;
      }
    }

    for (const index of indexes) {
      if (index['is_single_column'] && index['column_name'] === columnName) {
        attr.unique = true;
      }
    }

    return attr;
  }

  private getFieldTypeMap() {
    return fieldTypeMap[this.db.sequelize.getDialect()] || {};
  }

  protected extractTypeFromDefinition(rawType: string) {
    const leftParenIndex = rawType.indexOf('(');

    if (leftParenIndex === -1) {
      return rawType.toLowerCase();
    }

    return rawType.substring(0, leftParenIndex).toLowerCase().trim();
  }

  inferFieldTypeByRawType(rawType: string): any {
    const fieldTypeMap = this.getFieldTypeMap();
    const queryType = this.extractTypeFromDefinition(rawType);

    const mappedType = fieldTypeMap[queryType];

    if (_.isArray(mappedType)) {
      return {
        type: mappedType[0],
        possibleTypes: mappedType,
      };
    }

    return {
      type: mappedType,
    };
  }
}
