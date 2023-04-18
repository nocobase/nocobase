import Database from '../database';
import { Collection } from '../collection';
import { QueryInterface as SequelizeQueryInterface, Transactionable } from 'sequelize';

export default abstract class QueryInterface {
  sequelizeQueryInterface: SequelizeQueryInterface;

  protected constructor(public db: Database) {
    this.sequelizeQueryInterface = db.sequelize.getQueryInterface();
  }

  abstract collectionTableExists(collection: Collection, options?: Transactionable): Promise<boolean>;

  abstract listViews();

  abstract viewColumnUsage(options: { viewName: string; schema?: string }): Promise<{
    [view_column_name: string]: {
      column_name: string;
      table_name: string;
      table_schema?: string;
    };
  }>;

  async dropAll(options) {
    if (options.drop !== true) return;

    const views = await this.listViews();

    for (const view of views) {
      let removeSql;

      if (view.schema) {
        removeSql = `DROP VIEW IF EXISTS "${view.schema}"."${view.name}"`;
      } else {
        removeSql = `DROP VIEW IF EXISTS ${view.name}`;
      }

      await this.db.sequelize.query(removeSql, { transaction: options.transaction });
    }

    await this.db.sequelize.getQueryInterface().dropAllTables(options);
  }

  createJoinSQL(collection: Collection, associationPath: string) {
    const associations = collection.model.associations;
    const associationName = associationPath.split('.')[0];

    const queryInterface = this.db.sequelize.getQueryInterface();

    const q = queryInterface.quoteIdentifier.bind(queryInterface);
    const qs = queryInterface.quoteIdentifiers.bind(queryInterface);

    const association = associations[associationName] as any;

    if (!association) {
      throw new Error(`createJoinSQL: association ${associationName} not found`);
    }

    const associationModel = association.target;
    const targetCollection = this.db.modelCollection.get(associationModel);

    let joinSQL = 'LEFT JOIN ';

    if (association.associationType === 'HasOne') {
      joinSQL += `${targetCollection.quotedTableName()} as ${q(association.as)} ON ${collection.quotedTableName()}.${q(
        association.sourceKeyField,
      )} = ${q(association.as)}.${q(association.identifierField)}`;
    }

    if (association.associationType === 'BelongsTo') {
      joinSQL += `${targetCollection.quotedTableName()} as ${q(association.as)} ON ${collection.quotedTableName()}.${q(
        association.identifier,
      )} = ${q(association.as)}.${q(association.targetIdentifier)}`;
    }

    return joinSQL;
  }
}
