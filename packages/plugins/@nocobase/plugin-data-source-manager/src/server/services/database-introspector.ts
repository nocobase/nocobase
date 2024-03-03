import { Database, ViewFieldInference } from '@nocobase/database';
import { ColumnsDescription } from 'sequelize';
import lodash from 'lodash';
import typeInterfaceMap from './type-interface-map';

type tableInfo = {
  tableName: string;
  schema?: string;
};

type GetCollectionOptions = {
  tableInfo: tableInfo;
  localOptions?: PartialCollectionOptions;
};

export type LocalData = {
  [collectionName: string]: PartialCollectionOptions;
};

type GetCollectionsOptions = {
  localData?: LocalData;
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
  timestamps?: boolean;
  filterTargetKey?: string;
  fields: FieldOptions[];
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

export class DatabaseIntrospector {
  constructor(private db: Database) {}

  async getCollections(options: GetCollectionsOptions = {}): Promise<Array<CollectionOptions>> {
    const tableList = await this.db.sequelize.getQueryInterface().showAllTables();

    const batchSize = 5;
    const results = [];

    for (let i = 0; i < tableList.length; i += batchSize) {
      const batch = tableList.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (tableName) => {
          const tableInfo = {
            tableName,
          };

          const collectionOptions = this.tableInfoToCollectionOptions(tableInfo);
          const localOptions = options.localData?.[collectionOptions.name];

          try {
            return await this.getCollection({
              tableInfo,
              localOptions,
            });
          } catch (e) {
            if (e.message.includes('No description found for')) {
              return false;
            }

            throw e;
          }
        }),
      );

      results.push(...batchResults);
    }

    return results.filter(Boolean) as Array<CollectionOptions>;
  }

  async getCollection(options: GetCollectionOptions): Promise<CollectionOptions> {
    const { tableInfo } = options;

    const columnsInfo = await this.db.sequelize.getQueryInterface().describeTable(tableInfo);
    const collectionOptions = this.tableInfoToCollectionOptions(tableInfo);

    const constraints = await this.db.sequelize
      .getQueryInterface()
      .showIndex(this.db.inDialect('postgres') ? tableInfo : tableInfo.tableName);

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

      const remoteCollectionInfo: CollectionOptions = {
        ...collectionOptions,
        ...this.collectionOptionsByFields(supportFields),
        fields: supportFields,
      };

      if (unsupportedFields.length) {
        remoteCollectionInfo.unsupportedFields = unsupportedFields;
      }

      return this.mergeLocalDataIntoCollectionOptions(remoteCollectionInfo, options.localOptions);
    } catch (e) {
      throw new Error(`table ${tableInfo.tableName} introspection error: ${e.message}`);
    }
  }

  loadCollection(options: CollectionOptions) {
    this.db.collection({
      ...options,
      introspected: true,
    });
  }

  loadCollections(options: { collections: CollectionOptions[] }) {
    options.collections.forEach((collection) => {
      this.loadCollection(collection);
    });
  }

  public tableInfoToCollectionOptions(tableInfo: tableInfo): {
    name: string;
    schema?: string;
    tableName: string;
    title?: string;
  } {
    return {
      name: tableInfo.tableName,
      title: tableInfo.tableName,
      schema: tableInfo.schema,
      tableName: tableInfo.tableName,
    };
  }

  private collectionOptionsByFields(fields: FieldOptions[]): PartialCollectionOptions {
    const options: PartialCollectionOptions = {
      timestamps: false,
    };

    const autoIncrementField = fields.find((field) => field.autoIncrement);

    if (autoIncrementField) {
      options.filterTargetKey = autoIncrementField.name;
    }

    const primaryKeys = fields.filter((field) => field.primaryKey);

    if (!options.filterTargetKey && primaryKeys.length == 1) {
      options.filterTargetKey = primaryKeys[0].name;
    }

    const uniques = fields.filter((field) => field.unique);
    if (!options.filterTargetKey && uniques.length == 1) {
      options.filterTargetKey = uniques[0].name;
    }

    return options;
  }

  private mergeLocalDataIntoCollectionOptions(
    collectionOptions: CollectionOptions,
    localData: PartialCollectionOptions,
  ): CollectionOptions {
    if (!localData) {
      return collectionOptions;
    }

    const collectionFields = collectionOptions.fields || [];
    const localFieldsAsObject = lodash.keyBy(localData.fields, 'name');

    const newFields = collectionFields.map((field) => {
      const localField = localFieldsAsObject[field.name];

      if (!localField) {
        return field;
      }

      return {
        ...field,
        ...localField,
      };
    });

    // merge local association fields into remote collection
    const localAssociationFields = localData.fields?.filter((field) => {
      return ['belongsTo', 'belongsToMany', 'hasMany', 'hasOne'].includes(field.type);
    });

    if (localAssociationFields) {
      // @ts-ignore
      newFields.push(...localAssociationFields);
    }

    return {
      ...collectionOptions,
      ...lodash.omit(localData, ['fields']),
      fields: newFields,
    };
  }

  private columnInfoToFieldOptions(
    columnsInfo: ColumnsDescription,
    columnName: string,
    indexes: any,
  ): FiledInferResult {
    const columnInfo = columnsInfo[columnName];

    let fieldOptions: FieldOptions = {
      ...this.columnAttribute(columnsInfo, columnName, indexes),
      ...ViewFieldInference.inferToFieldType({
        dialect: this.db.options.dialect,
        type: columnInfo.type,
        name: columnName,
      }),
      rawType: columnInfo.type,
      name: columnName,
    };

    const interfaceConfig = this.getDefaultInterfaceByType(columnsInfo, columnName, fieldOptions.type);
    if (typeof interfaceConfig === 'string') {
      fieldOptions.interface = interfaceConfig;
    } else {
      fieldOptions = {
        ...fieldOptions,
        ...interfaceConfig,
      };
    }

    if (!fieldOptions.type) {
      return {
        rawType: columnInfo.type,
        name: columnName,
        supported: false,
      };
    }

    lodash.set(fieldOptions, 'uiSchema.title', columnName);

    return fieldOptions;
  }

  private getDefaultInterfaceByType(columnsInfo, columnName, type: string): object | string {
    const interfaceConfig = typeInterfaceMap[type];
    if (typeof interfaceConfig === 'function') {
      return interfaceConfig(columnsInfo[columnName]);
    }

    return interfaceConfig;
  }

  private columnAttribute(columnsInfo: ColumnsDescription, columnName: string, indexes: any) {
    const columnInfo = columnsInfo[columnName];

    const attr: any = {
      type: columnInfo.type,
      allowNull: columnInfo.allowNull,
      primaryKey: columnInfo.primaryKey,
      unique: false,
    };

    if (columnInfo.defaultValue && typeof columnInfo.defaultValue === 'string') {
      const isSerial = columnInfo.defaultValue.match(/^nextval\(/);
      const isUUID = columnInfo.defaultValue.match(/^uuid_generate_v4\(/);

      if (!isSerial && !isUUID) {
        attr.defaultValue = columnInfo.defaultValue;
      }

      if (isSerial || isUUID) {
        attr.autoIncrement = true;
      }
    }

    for (const index of indexes) {
      if (index.fields.length == 1 && index.fields[0].attribute == columnName && index.unique) {
        attr.unique = true;
      }
    }

    if (attr.primaryKey && columnName == 'id') {
      attr.autoIncrement = true;
    }

    return attr;
  }
}
