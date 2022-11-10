import { InheritedCollection } from './inherited-collection';
import lodash from 'lodash';

export class SyncRunner {
  static async syncInheritModel(model: any, options: any) {
    const inheritedCollection = model.collection as InheritedCollection;
    const db = inheritedCollection.context.database;
    const dialect = db.sequelize.getDialect();

    const queryInterface = db.sequelize.getQueryInterface();

    if (dialect != 'postgres') {
      throw new Error('Inherit model is only supported on postgres');
    }

    const parents = inheritedCollection.parents;

    const parentTables = parents.map((parent) => parent.model.tableName);

    const tableName = model.getTableName();

    const attributes = model.tableAttributes;

    const parentAttributes = inheritedCollection.parentAttributes();

    const childAttributes = lodash.omit(attributes, Object.keys(parentAttributes));
    await this.createTable(tableName, childAttributes, options, model, parentTables);

    if (options.alter) {
      const columns = await queryInterface.describeTable(tableName, options);

      for (const columnName in childAttributes) {
        if (!columns[columnName]) {
          await queryInterface.addColumn(tableName, columnName, childAttributes[columnName], options);
        }
      }
    }
  }

  static async createTable(tableName, attributes, options, model, parentTables) {
    let sql = '';

    options = { ...options };

    if (options && options.uniqueKeys) {
      lodash.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === undefined) {
          uniqueKey.customIndex = true;
        }
      });
    }

    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }

    const queryGenerator = model.queryGenerator;

    attributes = lodash.mapValues(attributes, (attribute) => model.sequelize.normalizeAttribute(attribute));

    attributes = queryGenerator.attributesToSQL(attributes, { table: tableName, context: 'createTable' });

    sql = `${queryGenerator.createTableQuery(tableName, attributes, options)}`.replace(
      ';',
      ` INHERITS (${parentTables.join(', ')});`,
    );

    return await model.sequelize.query(sql, options);
  }
}
