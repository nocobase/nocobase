import { Repository } from '@nocobase/database';
import lodash from 'lodash';
import { ChildOptions, SchemaNode, TargetPosition, UiSchemaNodeDAO } from './dao/ui_schema_node_dao';
import { uid } from '@nocobase/utils';
import { Transaction } from 'sequelize';

interface GetJsonSchemaOptions {
  includeAsyncNode?: boolean;
}

const nodeKeys = ['properties', 'patternProperties', 'additionalProperties'];

export default class UiSchemaRepository extends Repository {
  static schemaToSingleNodes(schema: any, carry: SchemaNode[] = [], childOptions: ChildOptions = null): SchemaNode[] {
    const node = lodash.isString(schema)
      ? {
          'x-uid': schema,
        }
      : schema;

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
NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
FROM ${this.model.tableName} as Schema
JOIN ${treeCollection.model.tableName} as TreePath ON TreePath.descendant = Schema.uid
JOIN ${
      treeCollection.model.tableName
    } as NodeInfo ON NodeInfo.descendant = Schema.uid and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
JOIN ${this.model.tableName} as ParentSchema ON (TreePath.descendant = ParentSchema.uid)
LEFT OUTER JOIN ${
      treeCollection.model.tableName
    } as ParentPath ON (ParentPath.descendant = ParentSchema.uid AND ParentPath.depth = 1)
WHERE TreePath.ancestor = :ancestor  ${options?.includeAsyncNode ? '' : 'AND (NodeInfo.async != true )'}
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
        ['x-index']: node.sort,
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
            .sort((a, b) => a['x-index'] - b['x-index'])
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

  treeCollection() {
    return this.database.getCollection('ui_schema_tree_path');
  }

  async insertBeside(targetUid: string, schema: any, side: 'before' | 'after') {
    const targetParent = await this.treeCollection().repository.findOne({
      filter: {
        descendant: targetUid,
        depth: 1,
      },
    });

    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);

    const rootNode = nodes[0];

    rootNode.childOptions = {
      parentUid: targetParent.get('ancestor') as string,
      type: 'properties',
      position: {
        type: side,
        target: targetUid,
      },
    };

    await this.insertNodes(nodes);
  }

  async insertInner(targetUid: string, schema: any, position: 'first' | 'last') {
    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    const rootNode = nodes[0];
    rootNode.childOptions = {
      parentUid: targetUid,
      type: 'properties',
      position,
    };

    await this.insertNodes(nodes);
  }

  async insertAfterBegin(targetUid: string, schema: any) {
    await this.insertInner(targetUid, schema, 'first');
  }

  async insertBeforeEnd(targetUid: string, schema: any) {
    await this.insertInner(targetUid, schema, 'last');
  }

  async insertBeforeBegin(targetUid: string, schema: any) {
    await this.insertBeside(targetUid, schema, 'before');
  }

  async insertAfterEnd(targetUid: string, schema: any) {
    await this.insertBeside(targetUid, schema, 'after');
  }

  async insertNodes(nodes: SchemaNode[]) {
    const transaction = await this.database.sequelize.transaction();

    try {
      for (const node of nodes) {
        await this.insertSingleNode(node, transaction);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async insert(schema: any) {
    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    await this.insertNodes(nodes);
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

    let savedNode;

    // check node exists or not
    const existsNode = await this.findOne({
      filter: {
        uid,
      },
      transaction,
    });

    if (existsNode) {
      savedNode = existsNode;
    } else {
      savedNode = await this.create({
        values: {
          name,
          uid,
          schema,
        },
        transaction,
      });
    }

    if (childOptions) {
      const parentUid = childOptions.parentUid;

      const treeTable = treeCollection.model.tableName;
      const isTreeQuery = await db.sequelize.query(
        `SELECT COUNT(*) as childrenCount from ${treeTable} WHERE ancestor = :ancestor AND descendant != ancestor`,
        {
          type: 'SELECT',
          replacements: {
            ancestor: uid,
          },
          transaction,
        },
      );

      const isTree = isTreeQuery[0]['childrenCount'];

      // if node is a tree root move tree to new path
      if (isTree) {
        await db.sequelize.query(
          `DELETE FROM ${treeTable} 
WHERE descendant IN (SELECT descendant FROM ${treeTable} WHERE ancestor = :uid)
AND ancestor IN (SELECT ancestor FROM  ${treeTable} WHERE descendant = :uid AND ancestor != descendant)
`,
          {
            type: 'DELETE',
            replacements: {
              uid,
            },
            transaction,
          },
        );

        await db.sequelize.query(
          `INSERT INTO ${treeTable} (ancestor, descendant, depth)
  SELECT supertree.ancestor, subtree.descendant, supertree.depth + subtree.depth + 1
  FROM ${treeTable} AS supertree
    CROSS JOIN ${treeTable} AS subtree
  WHERE supertree.descendant = :parentUid
    AND subtree.ancestor = :uid;`,
          {
            type: 'INSERT',
            replacements: {
              uid,
              parentUid,
            },
            transaction,
          },
        );
      }

      if (!isTree) {
        if (existsNode) {
          // remove old path
          await db.sequelize.query(`DELETE FROM ${treeTable} WHERE descendant = :uid AND ancestor != descendant`, {
            type: 'DELETE',
            replacements: {
              uid,
            },
            transaction,
          });
        }

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
      }

      if (!existsNode) {
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
      }

      const nodePosition = childOptions.position || 'last';

      let sort;

      // insert at first
      if (nodePosition === 'first') {
        sort = 1;
        // move all child last index
        await db.sequelize.query(
          `UPDATE ${treeCollection.model.tableName} SET sort = sort + 1 WHERE depth = 1 AND  ancestor = :ancestor`,
          {
            replacements: {
              ancestor: childOptions.parentUid,
            },
            transaction,
          },
        );
      }

      if (nodePosition === 'last') {
        const maxSort = await db.sequelize.query(
          `SELECT ${
            this.database.sequelize.getDialect() === 'postgres' ? 'coalesce' : 'ifnull'
          }(MAX(sort), 0) as maxSort FROM ${treeCollection.model.tableName} WHERE depth = 1 AND ancestor = :ancestor`,
          {
            type: 'SELECT',
            replacements: {
              ancestor: childOptions.parentUid,
            },
            transaction,
          },
        );

        sort = parseInt(maxSort[0]['maxSort']) + 1;
      }

      if (lodash.isPlainObject(nodePosition)) {
        const targetPosition = nodePosition as TargetPosition;
        const target = targetPosition.target;
        const targetSort = await db.sequelize.query(
          `SELECT sort FROM ${treeCollection.model.tableName} WHERE depth = 1 AND ancestor = :ancestor AND descendant = :descendant`,
          {
            type: 'SELECT',
            replacements: {
              ancestor: childOptions.parentUid,
              descendant: target,
            },
            transaction,
          },
        );

        sort = targetSort[0].sort;

        if (targetPosition.type == 'after') {
          sort += 1;
        }

        await db.sequelize.query(
          `UPDATE  ${treeCollection.model.tableName} SET sort = sort + 1 WHERE depth = 1 AND ancestor = :ancestor and sort >= :sort`,
          {
            replacements: {
              ancestor: childOptions.parentUid,
              sort,
            },
            transaction,
          },
        );
      }

      // update order
      const updateSql = `UPDATE ${treeCollection.model.tableName} SET sort = :sort WHERE depth = 1 AND ancestor = :ancestor AND descendant = :descendant`;
      await db.sequelize.query(updateSql, {
        type: 'UPDATE',
        replacements: {
          ancestor: childOptions.parentUid,
          sort,
          descendant: uid,
        },
        transaction,
      });
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
