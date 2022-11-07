import { Collection } from './collection';
import { InheritedCollection } from './inherited-collection';
import { Model } from './model';
import _ from 'lodash';

export class SyncRunner {
  static async syncInheritModel(model: any, options: any) {
    const inheritedCollection = model.collection as InheritedCollection;
    const db = inheritedCollection.context.database;
    const dialect = db.sequelize.getDialect();

    if (dialect != 'postgres') {
      throw new Error('Inherit model is only supported on postgres');
    }

    const parents = inheritedCollection.parents;
    const parentTables = parents.map((parent) => parent.model.tableName);

    const tableName = model.getTableName();

    const attributes = model.tableAttributes;

    await this.createTable(tableName, attributes, options, model, parentTables);
    return;
  }

  static async createTable(tableName, attributes, options, model, parentTables) {
    let sql = '';

    options = { ...options };

    if (options && options.uniqueKeys) {
      _.forOwn(options.uniqueKeys, (uniqueKey) => {
        if (uniqueKey.customIndex === undefined) {
          uniqueKey.customIndex = true;
        }
      });
    }

    if (model) {
      options.uniqueKeys = options.uniqueKeys || model.uniqueKeys;
    }

    const queryGenerator = model.queryGenerator;

    attributes = _.mapValues(attributes, (attribute) => model.sequelize.normalizeAttribute(attribute));

    attributes = queryGenerator.attributesToSQL(attributes, { table: tableName, context: 'createTable' });

    sql = `${queryGenerator.createTableQuery(tableName, attributes, options)}`.replace(
      ';',
      ` INHERITS (${parentTables.join(', ')});`,
    );

    return await model.sequelize.query(sql, options);
  }
}
