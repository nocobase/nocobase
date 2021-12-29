import { Repository } from '@nocobase/database';
import lodash from 'lodash';
import { SchemaNode, UiSchemaNodeDAO } from './dao/ui_schema_node_dao';
import { uid } from '@nocobase/utils';
import { Transaction } from 'sequelize';

export interface ChildOptions {
  parentUid: string;
  type: string;
}

interface GetJsonSchemaOptions {
  includeAsyncNode?: boolean;
}

const nodeKeys = ['properties', 'patternProperties', 'additionalProperties'];
export default class UiSchemaRepository extends Repository {
  static schemaToSingleNodes(schema: any, carry: SchemaNode[] = [], childOptions: ChildOptions = null): SchemaNode[] {
    const node = schema;

    if (!lodash.get(node, 'name')) {
      node.name = uid();
    }

    if (!lodash.get(node, 'x-uid')) {
      node['x-uid'] = uid();
    }

    if (childOptions) {
      node.childOptions = childOptions;
    }

    carry.push(node);

    for (const nodeKey of nodeKeys) {
      const nodeProperty = lodash.get(node, nodeKey);

      if (lodash.isObject(nodeProperty)) {
        const subNodeNames = lodash.keys(lodash.get(node, nodeKey));

        delete node[nodeKey];

        for (const subNodeName of subNodeNames) {
          const subSchema = {
            name: subNodeName,
            ...lodash.get(nodeProperty, subNodeName),
          };

          carry = this.schemaToSingleNodes(subSchema, carry, {
            parentUid: node['x-uid'],
            type: nodeKey,
          });
        }
      }
    }

    return carry;
  }

  async getProperties(uid: string) {
    const db = this.database;
    const treeCollection = db.getCollection('ui_schema_tree_path');

    const rawSql = `
SELECT Schema.uid as uid, Schema.name as name, Schema.schema as schema ,
TreePath.depth as depth,
NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent
FROM ${treeCollection.model.tableName} as TreePath 
LEFT JOIN ${this.model.tableName} as Schema ON Schema.uid =  TreePath.descendant
LEFT JOIN ${treeCollection.model.tableName} as NodeInfo ON NodeInfo.descendant = Schema.uid and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
LEFT JOIN ${treeCollection.model.tableName} as ParentPath ON (ParentPath.descendant = Schema.uid AND ParentPath.depth = 1)
WHERE TreePath.ancestor = :ancestor  AND (NodeInfo.async  = false or TreePath.depth = 1)`;

    const nodes = await db.sequelize.query(rawSql, {
      replacements: {
        ancestor: uid,
      },
    });

    const schema = this.nodesToSchema(nodes[0]);
    return lodash.pick(schema, ['type', 'properties']);
  }

  async getJsonSchema(uid: string, options?: GetJsonSchemaOptions) {
    const db = this.database;
    const treeCollection = db.getCollection('ui_schema_tree_path');

    const rawSql = `
SELECT Schema.uid as uid, Schema.name as name, Schema.schema as schema ,
TreePath.depth as depth,
NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent
FROM ${this.model.tableName} as Schema
JOIN ${treeCollection.model.tableName} as TreePath ON TreePath.descendant = Schema.uid
JOIN ${
      treeCollection.model.tableName
    } as NodeInfo ON NodeInfo.descendant = Schema.uid and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
JOIN ${this.model.tableName} as ParentSchema ON (TreePath.descendant = ParentSchema.uid)
LEFT OUTER JOIN ${
      treeCollection.model.tableName
    } as ParentPath ON (ParentPath.descendant = ParentSchema.uid AND ParentPath.depth = 1)
WHERE TreePath.ancestor = :ancestor  ${
      options?.includeAsyncNode
        ? 'AND NodeInfo.async != true  AND ParentPath.depth <= 1 '
        : 'AND (NodeInfo.async != true )'
    }
      `;

    const nodes = await db.sequelize.query(rawSql, {
      replacements: {
        ancestor: uid,
      },
    });

    const schema = this.nodesToSchema(nodes[0]);
    return schema;
  }

  nodesToSchema(nodes) {
    const nodeAttributeSanitize = (node) => {
      const schema = {
        ...(lodash.isPlainObject(node.schema) ? node.schema : JSON.parse(node.schema)),
        ...lodash.pick(node, [...nodeKeys, 'name']),
        ['x-uid']: node.uid,
        ['x-async']: !!node.async,
      };

      return schema;
    };

    const buildTree = (rootNode) => {
      const children = nodes.filter((node) => node.parent == rootNode.uid);

      if (children.length > 0) {
        const childrenGroupByType = lodash.groupBy(children, 'type');

        for (const childType of Object.keys(childrenGroupByType)) {
          const properties = childrenGroupByType[childType]
            .map((child) => buildTree(child))
            .reduce((carry, item) => {
              carry[item.name] = item;
              delete item['name'];
              return carry;
            }, {});

          rootNode[childType] = properties;
        }
      }

      return nodeAttributeSanitize(rootNode);
    };

    return buildTree(nodes.find((node) => node.parent == null));
  }

  async insert(schema: any) {
    const transaction = await this.database.sequelize.transaction();

    try {
      const nodes = UiSchemaRepository.schemaToSingleNodes(schema);

      for (const node of nodes) {
        await this.insertSingleNode(node, transaction);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async insertSingleNode(schema: SchemaNode, transaction?: Transaction) {
    let handleTransaction = false;
    if (!transaction) {
      transaction = await this.database.sequelize.transaction();
      handleTransaction = true;
    }

    const db = this.database;
    const treeCollection = db.getCollection('ui_schema_tree_path');

    const uid = schema['x-uid'];
    const name = schema['name'];
    const async = lodash.get(schema, 'x-async', false);
    const childOptions = schema['childOptions'];

    delete schema['x-uid'];
    delete schema['x-async'];
    delete schema['name'];
    delete schema['childOptions'];

    const savedNode = await this.create({
      values: {
        name,
        uid,
        schema,
      },
      transaction,
    });

    if (childOptions) {
      const parentUid = childOptions.parentUid;

      // insert tree path
      await db.sequelize.query(
        `INSERT INTO ${treeCollection.model.tableName} (ancestor, descendant, depth)
SELECT t.ancestor, :modelKey, depth + 1 FROM ${treeCollection.model.tableName} AS t  WHERE t.descendant = :modelParentKey `,
        {
          type: 'INSERT',
          transaction,
          replacements: {
            modelKey: savedNode.get('uid'),
            modelParentKey: parentUid,
          },
        },
      );

      // insert type && async
      await db.sequelize.query(
        `INSERT INTO ${treeCollection.model.tableName}(ancestor, descendant, depth, type, async) VALUES (:modelKey, :modelKey, 0, :type, :async )`,
        {
          type: 'INSERT',
          replacements: {
            modelKey: savedNode.get('uid'),
            type: childOptions.type,
            async,
          },
          transaction,
        },
      );

      // update order
      // await db.sequelize.query(
      //   `UPDATE ${treeCollection.model.tableName} SET  WHERE depth = 1 AND ancestor = :ancestor AND descendant = :descendant`,
      //   {
      //     type: 'UPDATE',
      //     replacements: {
      //       ancestor: childOptions.parentUid,
      //       descendant: uid,
      //     },
      //   },
      // );
    } else {
      // insert root node path
      await db.sequelize.query(
        `INSERT INTO ${treeCollection.model.tableName}(ancestor, descendant, depth, async) VALUES (:modelKey, :modelKey, 0, :async )`,
        {
          type: 'INSERT',
          replacements: {
            modelKey: savedNode.get('uid'),
            async,
          },
          transaction,
        },
      );
    }

    if (handleTransaction) {
      await transaction.commit();
    }
  }
}
