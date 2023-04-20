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
    const queryInterface = this.db.sequelize.getQueryInterface();

    const q = queryInterface.quoteIdentifier.bind(queryInterface);

    let joinSQL = '';
    let preAs = collection.quotedTableName();

    let model = collection.model;

    const associationPaths = associationPath.split('.');

    for (let i = 0; i < associationPaths.length; i++) {
      const associationName = associationPaths[i];
      const associations = model.associations;
      const association = associations[associationName] as any;

      if (!association) {
        if (i === associationPaths.length - 1) {
          continue;
        }

        throw new Error(`createJoinSQL: association ${associationName} not found`);
      }

      joinSQL += ' LEFT JOIN ';
      const associationModel = association.target;
      const targetCollection = this.db.modelCollection.get(associationModel);

      if (association.associationType === 'HasOne' || association.associationType === 'HasMany') {
        joinSQL += `${targetCollection.quotedTableName()} as ${q(association.as)} ON ${preAs}.${q(
          association.sourceKeyField,
        )} = ${q(association.as)}.${q(association.identifierField)}`;
      }

      if (association.associationType === 'BelongsTo') {
        joinSQL += `${targetCollection.quotedTableName()} as ${q(association.as)} ON ${preAs}.${q(
          association.identifier,
        )} = ${q(association.as)}.${q(association.targetIdentifier)}`;
      }

      if (association.associationType === 'BelongsToMany') {
        const throughModel = association.through.model;
        const throughCollection = this.db.modelCollection.get(throughModel);

        joinSQL += `${throughCollection.quotedTableName()} as ${q(throughModel.name)} ON ${q(collection.name)}.${q(
          association.sourceKeyField,
        )} = ${q(throughModel.name)}.${q(throughModel.rawAttributes[association.foreignKey].field)}`;

        joinSQL += ` LEFT JOIN ${targetCollection.quotedTableName()} as ${q(association.as)} ON ${q(
          association.as,
        )}.${q(association.targetKeyField)} = ${q(throughModel.name)}.${q(
          throughModel.rawAttributes[association.otherKey].field,
        )}`;
      }

      collection = targetCollection;
      model = targetCollection.model;
      preAs = q(association.as);
    }

    return joinSQL;
  }
}
