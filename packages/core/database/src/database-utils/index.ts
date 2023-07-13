import Database from '../database';
import lodash from 'lodash';

export default class DatabaseUtils {
  constructor(public db: Database) {}

  addSchema(tableName, schema?) {
    if (!this.db.inDialect('postgres')) return tableName;
    if (this.db.options.schema && !schema) {
      schema = this.db.options.schema;
    }

    if (schema) {
      // @ts-ignore
      tableName = this.db.sequelize.getQueryInterface().queryGenerator.addSchema({
        tableName,
        _schema: schema,
      });
    }

    return tableName;
  }

  quoteTable(tableName) {
    const queryGenerator = this.db.sequelize.getQueryInterface().queryGenerator;
    // @ts-ignore
    tableName = queryGenerator.quoteTable(lodash.isPlainObject(tableName) ? tableName : this.addSchema(tableName));

    return tableName;
  }

  schema() {
    if (!this.db.inDialect('postgres')) {
      return undefined;
    }

    return this.db.options.schema || 'public';
  }
}
