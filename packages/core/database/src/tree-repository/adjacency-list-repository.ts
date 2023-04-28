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

    const childInstances = (
      await super.find({
        ...lodash.omit(options, ['limit', 'offset', 'filterByTk']),
        fields: [primaryKey, foreignKey, ...(options.fields || [])],
        filter: {
          [primaryKey]: childIds,
        },
      })
    ).map((r) => {
      return r.toJSON();
    });

    const nodeMap = {};

    childInstances.forEach((node) => {
      if (!nodeMap[`${node[foreignKey]}`]) {
        nodeMap[`${node[foreignKey]}`] = [];
      }
      nodeMap[`${node[foreignKey]}`].push(node);
    });

    function buildTree(parentId) {
      const children = nodeMap[parentId];

      if (!children) {
        return undefined;
      }

      return children.map((child) => ({
        ...child,
        [childrenKey]: buildTree(child.id),
      }));
    }

    for (const parent of parentNodes) {
      const parentId = parent[primaryKey];
      const children = buildTree(parentId);
      parent.setDataValue(childrenKey, children);
    }

    this.addIndex(parentNodes, childrenKey);

    return parentNodes;
  }

  private addIndex(treeArray, childrenKey = 'children') {
    function traverse(node, index) {
      let children;

      if (lodash.isPlainObject(node)) {
        node['__index'] = `${index}`;
        children = node[childrenKey];
      } else {
        node.setDataValue('__index', `${index}`);
        children = node.getDataValue(childrenKey);
      }

      if (children && children.length > 0) {
        children.forEach((child, i) => {
          traverse(child, `${index}.${childrenKey}.${i}`);
        });
      }
    }

    treeArray.forEach((tree, i) => {
      traverse(tree, i);
    });
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
