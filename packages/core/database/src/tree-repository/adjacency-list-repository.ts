import { FindOptions, Repository } from '../repository';
import lodash from 'lodash';

export class AdjacencyListRepository extends Repository {
  async find(options?: FindOptions): Promise<any> {
    const parentNodes = await super.find(lodash.omit(options, ['appends']));

    if (parentNodes.length === 0) {
      return [];
    }

    const templateModel = parentNodes[0];
    const collection = this.database.modelCollection.get(templateModel.constructor);

    const sql = this.querySQL(
      parentNodes.map((node) => node.id),
      collection,
    );

    const childNodes = await this.database.sequelize.query(sql, {
      type: 'SELECT',
      transaction: options.transaction,
    });

    console.log({ childNodes });
    return parentNodes;
  }

  private querySQL(rootIds, collection) {
    const { treeChildrenField, treeParentField } = collection;
    const foreignKey = treeParentField.options.foreignKey;

    const queryInterface = this.database.sequelize.getQueryInterface();
    const q = queryInterface.quoteIdentifier.bind(queryInterface);

    return `
      WITH RECURSIVE cte AS (
        SELECT id, ${q(foreignKey)}, 1 AS level
        FROM ${collection.quotedTableName()}
        WHERE ${q(foreignKey)} IN (${rootIds.join(',')})
        UNION ALL
        SELECT t.id, t.${q(foreignKey)}, cte.level + 1 AS level
        FROM ${collection.quotedTableName()} t
        JOIN cte ON t.${q(foreignKey)} = cte.id
      )
      SELECT id, ${q(foreignKey)}, level
      FROM cte
    `;
  }
}
