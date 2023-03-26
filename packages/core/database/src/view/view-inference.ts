import Database from '../database';
import FieldTypeMap from './field-type-map';
import { isArray } from 'mathjs';

type InferredField = {
  name: string;
  type: string;
  source?: string;
};

type InferredFieldResult = {
  [key: string]: InferredField;
};

export class ViewFieldInference {
  static async inferFields(options: {
    db: Database;
    viewName: string;
    viewSchema?: string;
  }): Promise<InferredFieldResult> {
    const { db } = options;
    if (!db.inDialect('postgres')) {
      options.viewSchema = undefined;
    }

    const columns = await db.sequelize.getQueryInterface().describeTable(options.viewName, options.viewSchema);

    const columnUsage = await db.queryInterface.viewColumnUsage({
      viewName: options.viewName,
      schema: options.viewSchema,
    });

    console.log('columnUsage', columnUsage);
    // @ts-ignore
    return Object.fromEntries(
      Object.entries(columns).map(([name, column]) => {
        const usage = columnUsage.find((item) => item.column_name === name);

        if (usage) {
          const collectionField = (() => {
            const tableName = `${usage.table_schema ? `${usage.table_schema}.` : ''}${usage.table_name}`;
            const collection = db.tableNameCollectionMap.get(tableName);
            if (!collection) return false;

            const fieldValue = Object.values(collection.model.rawAttributes).find(
              (field) => field.field === usage.column_name,
            );

            if (!fieldValue) {
              return false;
            }

            // @ts-ignore
            const fieldName = fieldValue?.fieldName;

            return collection.getField(fieldName);
          })();

          if (collectionField) {
            return [
              name,
              {
                name,
                type: collectionField.type,
                source: `${collectionField.collection.name}.${collectionField.name}`,
              },
            ];
          }
        }

        return [
          name,
          {
            name,
            ...this.inferToFieldType({ db, name, type: column.type }),
          },
        ];
      }),
    );
  }

  static inferToFieldType(options: { db: Database; name: string; type: string }) {
    const { db } = options;
    const dialect = db.sequelize.getDialect();
    const fieldTypeMap = FieldTypeMap[dialect];
    const mappedType = fieldTypeMap[options.type.toLowerCase()];
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
}
