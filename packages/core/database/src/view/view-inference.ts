import Database from '../database';

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
    const columns = await db.sequelize.getQueryInterface().describeTable(options.viewName, options.viewSchema);

    const columnUsage = await db.queryInterface.viewColumnUsage({
      viewName: options.viewName,
      schema: options.viewSchema,
    });

    // @ts-ignore
    return Object.fromEntries(
      Object.entries(columns).map(([name, column]) => {
        const usage = columnUsage.find((item) => item.column_name === name);

        if (usage) {
          const collectionField = (() => {
            const collection = db.tableNameCollectionMap.get(`${usage.table_schema}.${usage.table_name}`);
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

        return [name, {}];
      }),
    );
  }
}
