import { FindOptions, Repository } from '../repository';
import lodash from 'lodash';

export class AdjacencyListRepository extends Repository {
  async find(options?: FindOptions): Promise<any> {
    const parentNodes = await super.find(lodash.omit(options));

    if (parentNodes.length === 0) {
      return [];
    }

    const templateModel = parentNodes[0];
    const collection = this.database.modelCollection.get(templateModel.constructor);
    const primaryKey = collection.model.primaryKeyAttribute;
    const { treeParentField } = collection;
    const foreignKey = treeParentField.options.foreignKey;

    const childrenKey = collection.treeChildrenField?.name ?? 'children';

    const sql = this.querySQL(
      parentNodes.map((node) => node.id),
      collection,
    );

    const childNodes = await this.database.sequelize.query(sql, {
      type: 'SELECT',
      transaction: options.transaction,
    });

    const childIds = childNodes.map((node) => node[primaryKey]);

    const childInstances = await super.find({
      ...lodash.omit(options, ['limit', 'offset']),
      filter: {
        [primaryKey]: childIds,
      },
    });

    const nodeMap = {};
    for (const node of [...parentNodes, ...childInstances]) {
      nodeMap[node[primaryKey]] = node;
    }

    for (const node of childNodes) {
      const parentNode = nodeMap[node[foreignKey]];
      const childNode = nodeMap[node[primaryKey]];

      if (!parentNode) {
        throw new Error(`Cannot find parent node ${node[foreignKey]}`);
      }

      const children = parentNode.getDataValue(childrenKey);
      if (!children) {
        parentNode.setDataValue(childrenKey, []);
      }

      parentNode.getDataValue(childrenKey).push(childNode);
    }

    this.addIndexToTree(parentNodes);
    return parentNodes;
  }

  private addIndexToTree(treeArr, index = '') {
    for (let i = 0; i < treeArr.length; i++) {
      // 遍历tree数组
      const tree = treeArr[i]; // 取出当前节点
      const children = tree.getDataValue('children'); // 取出当前节点的children
      // tree.index = `${index}${i}`; // 给当前节点增加index属性

      console.log({ index: `${index}${i}` });

      tree.setDataValue('__index', `${index}${i}`);

      if (children) {
        // 如果children存在
        this.addIndexToTree(children, `${tree.index}.children.`); // 递归遍历子节点，并给它们增加index属性
      }
    }
    return treeArr;
  }
  private querySQL(rootIds, collection) {
    const { treeChildrenField, treeParentField } = collection;
    const foreignKey = treeParentField.options.foreignKey;
    const foreignKeyField = collection.model.rawAttributes[foreignKey].field;

    const primaryKey = collection.model.primaryKeyAttribute;

    const queryInterface = this.database.sequelize.getQueryInterface();
    const q = queryInterface.quoteIdentifier.bind(queryInterface);

    return `
      WITH RECURSIVE cte AS (
        SELECT ${q(primaryKey)}, ${q(foreignKeyField)}, 1 AS level
        FROM ${collection.quotedTableName()}
        WHERE ${q(foreignKeyField)} IN (${rootIds.join(',')})
        UNION ALL
        SELECT t.${q(primaryKey)}, t.${q(foreignKeyField)}, cte.level + 1 AS level
        FROM ${collection.quotedTableName()} t
               JOIN cte ON t.${q(foreignKeyField)} = cte.${q(primaryKey)}
      )
      SELECT ${q(primaryKey)}, ${q(foreignKeyField)} as ${q(foreignKey)}, level
      FROM cte
    `;
  }
}
