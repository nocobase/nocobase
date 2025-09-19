/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Database, Repository, fieldTypeMap } from '@nocobase/database';
import EventEmitter from 'events';
import lodash from 'lodash';
import { ColumnsDescription } from 'sequelize';
import { isArray } from 'mathjs';
import { typeInterfaceMap } from './type-interface-map';

export type tableInfo = {
  tableName: string;
  schema?: string;
};

type GetCollectionOptions = {
  tableInfo: tableInfo;
  localOptions?: PartialCollectionOptions;
  mergedOptions?: PartialCollectionOptions;
};

export type PartialCollectionOptions = Partial<
  Omit<CollectionOptions, 'fields'> & {
    fields?: Partial<FieldOptions>[];
  }
>;

interface CollectionOptions {
  name: string;
  schema?: string;
  tableName: string;
  title?: string;
  template?: string;
  timestamps?: boolean;
  filterTargetKey?: string | Array<string>;
  fields: FieldOptions[];
  autoGenId?: boolean;
  view?: boolean;
  unsupportedFields?: UnsupportedFieldOptions[];
}

interface UnsupportedFieldOptions {
  rawType: string;
  name: string;
  supported: false;
}

type FiledInferResult = FieldOptions | UnsupportedFieldOptions;

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

interface DatabaseIntrospectorOptions {
  db: Database;
  typeInterfaceMap?: any;
}

export class DatabaseIntrospector extends EventEmitter {
  db: Database;

  constructor(options: DatabaseIntrospectorOptions) {
    super();
    this.db = options.db;
  }

  protected getFieldTypeMap(): Record<string, string | Array<string>> {
    return fieldTypeMap[this.db.sequelize.getDialect()];
  }

  protected getTypeInterfaceConfig(type: string): Record<string, any> {
    return typeInterfaceMap[type] || {};
  }

  async getTableList() {
    return await this.db.sequelize.getQueryInterface().showAllTables();
  }

  async getTableColumnsInfo(tableInfo: tableInfo) {
    return this.db.sequelize.getQueryInterface().describeTable(tableInfo);
  }

  async getTableConstraints(tableInfo: tableInfo) {
    return this.db.sequelize.getQueryInterface().showIndex(tableInfo.tableName);
  }

  async getViewList() {
    return (await this.db.queryInterface.listViews()).map((view) => view.name);
  }

  excludeViewsOrTables() {
    return [];
  }

  async getTables(options: any = {}) {
    let tableList = await this.getTableList();
    const views = options.views?.length ? options.views : await this.getViewList();

    tableList = tableList.concat(views);

    tableList = tableList.filter((tableName) => {
      return !this.excludeViewsOrTables().includes(tableName);
    });
    if (this.db.options.tablePrefix) {
      tableList = tableList.filter((tableName) => {
        return tableName.startsWith(this.db.options.tablePrefix);
      });
    }
    return tableList;
  }

  async getCollection(options: GetCollectionOptions): Promise<CollectionOptions> {
    const { tableInfo, localOptions = {}, mergedOptions = {} } = options;

    const columnsInfo = await this.getTableColumnsInfo(tableInfo);

    const constraints = await this.getTableConstraints(tableInfo);
    const collectionOptions = this.tableInfoToCollectionOptions(tableInfo);

    try {
      const fields: Array<FiledInferResult> = Object.keys(columnsInfo).map((columnName) => {
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
        ...localOptions,
        ...mergedOptions,
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

  public tableInfoToCollectionOptions(tableInfo: tableInfo) {
    const tableName = tableInfo.tableName;
    let name = tableName;

    if (this.db.options.tablePrefix) {
      name = tableName.replace(this.db.options.tablePrefix, '');
    }
    //replace dot to underscore
    name = name.replace(/\./g, '_');

    return {
      name,
      title: name,
      schema: tableInfo.schema,
      tableName,
    };
  }

  protected extractTypeFromDefinition(rawType: string) {
    const leftParenIndex = rawType.indexOf('(');

    if (leftParenIndex === -1) {
      return rawType.toLowerCase();
    }

    return rawType.substring(0, leftParenIndex).toLowerCase().trim();
  }

  protected inferFieldTypeByRawType(rawType: string): any {
    const fieldTypeMap = this.getFieldTypeMap();
    const queryType = this.extractTypeFromDefinition(rawType);

    const mappedType = fieldTypeMap[queryType];

    if (isArray(mappedType)) {
      return {
        type: mappedType[0],
        possibleTypes: mappedType,
      };
    }

    return {
      type: mappedType,
    };
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

  protected columnInfoToFieldOptions(
    columnsInfo: ColumnsDescription,
    columnName: string,
    indexes: any,
  ): FiledInferResult {
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

    lodash.set(fieldOptions, 'uiSchema.title', columnName);

    return fieldOptions;
  }

  protected columnAttribute(columnsInfo: ColumnsDescription, columnName: string, indexes: any) {
    const columnInfo = columnsInfo[columnName];

    const attr: any = {
      type: columnInfo.type,
      allowNull: columnInfo.defaultValue ? true : columnInfo.allowNull,
      primaryKey: columnInfo.primaryKey,
      unique: false,
      autoIncrement: columnInfo.autoIncrement,
      description: columnInfo.comment,
      elementType: columnInfo['elementType'],
    };

    if (columnInfo.defaultValue && typeof columnInfo.defaultValue === 'string') {
      const isSerial = columnInfo.defaultValue.match(/^nextval\(/);
      const isUUID = columnInfo.defaultValue.match(/^uuid_generate_v4\(/);

      if (isSerial || isUUID) {
        attr.autoIncrement = true;
      }
    }

    for (const index of indexes) {
      if (index.fields.length == 1 && index.fields[0].attribute == columnName && index.unique) {
        attr.unique = true;
      }
    }

    return attr;
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

  private getDefaultInterfaceByType(columnsInfo, columnName, type: string): object | string {
    const interfaceConfig = this.getTypeInterfaceConfig(type);

    let interfaceRes = interfaceConfig;
    if (typeof interfaceConfig === 'function') {
      interfaceRes = interfaceConfig(columnsInfo[columnName]);
    }

    return interfaceRes;
  }
}
