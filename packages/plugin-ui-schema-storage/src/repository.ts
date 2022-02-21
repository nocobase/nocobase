import { Repository, TransactionAble } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import lodash from 'lodash';
import { Transaction } from 'sequelize';
import { ChildOptions, SchemaNode, TargetPosition } from './dao/ui_schema_node_dao';

interface GetJsonSchemaOptions {
  includeAsyncNode?: boolean;
  transaction?: Transaction;
}

type BreakRemoveOnType = {
  [key: string]: any;
};

export interface removeParentOptions {
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: BreakRemoveOnType;
}

interface InsertAdjacentOptions extends removeParentOptions {}

const nodeKeys = ['properties', 'definitions', 'patternProperties', 'additionalProperties', 'items'];

export class UiSchemaRepository extends Repository {
  tableNameAdapter(tableName) {
    if (this.database.sequelize.getDialect() === 'postgres') {
      return `"${tableName}"`;
    }
    return tableName;
  }

  get uiSchemasTableName() {
    return this.tableNameAdapter(this.model.tableName);
  }

  get uiSchemaTreePathTableName() {
    const model = this.database.getCollection('uiSchemaTreePath').model;
    return this.tableNameAdapter(model.tableName);
  }

  sqlAdapter(sql: string) {
    if (this.database.sequelize.getDialect() === 'mysql') {
      return lodash.replace(sql, /"/g, '`');
    }

    return sql;
  }

  static schemaToSingleNodes(schema: any, carry: SchemaNode[] = [], childOptions: ChildOptions = null): SchemaNode[] {
    const node = lodash.cloneDeep(
      lodash.isString(schema)
        ? {
            'x-uid': schema,
          }
        : schema,
    );

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

      // array items
      if (nodeKey === 'items' && nodeProperty) {
        const handleItems = lodash.isArray(nodeProperty) ? nodeProperty : [nodeProperty];
        for (const item of handleItems) {
          carry = this.schemaToSingleNodes(item, carry, {
            parentUid: node['x-uid'],
            type: nodeKey,
          });
        }
      } else if (lodash.isPlainObject(nodeProperty)) {
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

    const rawSql = `
        SELECT "SchemaTable"."x-uid" as "x-uid", "SchemaTable"."name" as "name", "SchemaTable"."schema" as "schema",
               TreePath.depth as depth,
               NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
        FROM ${this.uiSchemaTreePathTableName} as TreePath
                 LEFT JOIN ${this.uiSchemasTableName} as "SchemaTable" ON "SchemaTable"."x-uid" =  TreePath.descendant
                 LEFT JOIN ${this.uiSchemaTreePathTableName} as NodeInfo ON NodeInfo.descendant = "SchemaTable"."x-uid" and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
                 LEFT JOIN ${this.uiSchemaTreePathTableName} as ParentPath ON (ParentPath.descendant = "SchemaTable"."x-uid" AND ParentPath.depth = 1)
        WHERE TreePath.ancestor = :ancestor  AND (NodeInfo.async  = false or TreePath.depth = 1)`;

    const nodes = await db.sequelize.query(this.sqlAdapter(rawSql), {
      replacements: {
        ancestor: uid,
      },
    });

    if (nodes[0].length == 0) {
      return {};
    }

    const schema = this.nodesToSchema(nodes[0], uid);
    return lodash.pick(schema, ['type', 'properties']);
  }

  async getJsonSchema(uid: string, options?: GetJsonSchemaOptions): Promise<any> {
    const db = this.database;

    const treeTable = this.uiSchemaTreePathTableName;

    const rawSql = `
        SELECT "SchemaTable"."x-uid" as "x-uid", "SchemaTable"."name" as name, "SchemaTable"."schema" as "schema" ,
               TreePath.depth as depth,
               NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
        FROM ${treeTable} as TreePath
                 LEFT JOIN ${this.uiSchemasTableName} as "SchemaTable" ON "SchemaTable"."x-uid" =  TreePath.descendant
                 LEFT JOIN ${treeTable} as NodeInfo ON NodeInfo.descendant = "SchemaTable"."x-uid" and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
                 LEFT JOIN ${treeTable} as ParentPath ON (ParentPath.descendant = "SchemaTable"."x-uid" AND ParentPath.depth = 1)
        WHERE TreePath.ancestor = :ancestor  ${options?.includeAsyncNode ? '' : 'AND (NodeInfo.async != true )'}
    `;

    const nodes = await db.sequelize.query(this.sqlAdapter(rawSql), {
      replacements: {
        ancestor: uid,
      },
      transaction: options?.transaction,
    });

    if (nodes[0].length == 0) {
      return {};
    }

    const schema = this.nodesToSchema(nodes[0], uid);
    return schema;
  }

  private ignoreSchemaProperties(schemaProperties) {
    return lodash.omit(schemaProperties, nodeKeys);
  }

  nodesToSchema(nodes, rootUid) {
    const nodeAttributeSanitize = (node) => {
      const schema = {
        ...this.ignoreSchemaProperties(lodash.isPlainObject(node.schema) ? node.schema : JSON.parse(node.schema)),
        ...lodash.pick(node, [...nodeKeys, 'name']),
        ['x-uid']: node['x-uid'],
        ['x-async']: !!node.async,
      };

      if (lodash.isNumber(node.sort)) {
        schema['x-index'] = node.sort;
      }

      return schema;
    };

    const buildTree = (rootNode) => {
      const children = nodes.filter((node) => node.parent == rootNode['x-uid']);

      if (children.length > 0) {
        const childrenGroupByType = lodash.groupBy(children, 'type');

        for (const childType of Object.keys(childrenGroupByType)) {
          const properties = childrenGroupByType[childType]
            .map((child) => buildTree(child))
            .sort((a, b) => a['x-index'] - b['x-index']) as any;

          rootNode[childType] =
            childType == 'items'
              ? properties.length == 1
                ? properties[0]
                : properties
              : properties.reduce((carry, item) => {
                  carry[item.name] = item;
                  delete item['name'];
                  return carry;
                }, {});
        }
      }

      return nodeAttributeSanitize(rootNode);
    };

    return buildTree(nodes.find((node) => node['x-uid'] == rootUid));
  }

  treeCollection() {
    return this.database.getCollection('uiSchemaTreePath');
  }

  async patch(newSchema: any, options?) {
    let handleTransaction = true;
    let transaction;
    if (options?.transaction) {
      handleTransaction = false;
      transaction = options.transaction;
    } else {
      transaction = await this.database.sequelize.transaction();
    }

    const rootUid = newSchema['x-uid'];
    const oldTree = await this.getJsonSchema(rootUid);

    const traverSchemaTree = async (schema, path = []) => {
      const node = schema;
      const oldNode = path.length == 0 ? oldTree : lodash.get(oldTree, path);
      const oldNodeUid = oldNode['x-uid'];

      await this.updateNode(oldNodeUid, node, transaction);

      const properties = node.properties;
      if (lodash.isPlainObject(properties)) {
        for (const name of Object.keys(properties)) {
          await traverSchemaTree(properties[name], [...path, 'properties', name]);
        }
      }
    };

    try {
      await traverSchemaTree(newSchema);

      handleTransaction && (await transaction.commit());
    } catch (err) {
      handleTransaction && (await transaction.rollback());
      throw err;
    }
  }

  async updateNode(uid: string, schema: any, transaction?: Transaction) {
    const nodeModel = await this.findOne({
      filter: {
        'x-uid': uid,
      },
    });

    await nodeModel.update(
      {
        schema: {
          ...(nodeModel.get('schema') as any),
          ...lodash.omit(schema, ['x-async', 'name', 'x-uid', 'properties']),
        },
      },
      {
        hooks: false,
        transaction,
      },
    );
  }

  protected async childrenCount(uid, transaction) {
    const db = this.database;

    const countResult = await db.sequelize.query(
      `SELECT COUNT(*) as count FROM ${this.uiSchemaTreePathTableName} where ancestor = :ancestor and depth  = 1`,
      {
        replacements: {
          ancestor: uid,
        },
        type: 'SELECT',
        transaction,
      },
    );

    return parseInt(countResult[0]['count']);
  }

  protected async isLeafNode(uid, transaction) {
    const childrenCount = await this.childrenCount(uid, transaction);
    return childrenCount === 0;
  }

  async findParentUid(uid, transaction?) {
    const parent = await this.database.getRepository('uiSchemaTreePath').findOne({
      filter: {
        descendant: uid,
        depth: 1,
      },
      transaction,
    });

    return parent ? (parent.get('ancestor') as string) : null;
  }

  protected async findNodeSchemaWithParent(uid, transaction) {
    const schema = await this.database.getRepository('uiSchemas').findOne({
      filter: {
        'x-uid': uid,
      },
      transaction,
    });

    return {
      parentUid: await this.findParentUid(uid, transaction),
      schema,
    };
  }

  protected async isSingleChild(uid, transaction) {
    const db = this.database;

    const parent = await this.findParentUid(uid, transaction);

    if (!parent) {
      return null;
    }

    const parentChildrenCount = await this.childrenCount(parent, transaction);

    if (parentChildrenCount == 1) {
      const schema = await db.getRepository('uiSchemas').findOne({
        filter: {
          'x-uid': parent,
        },
        transaction,
      });

      return schema;
    }

    return null;
  }

  async removeEmptyParents(options: TransactionAble & { uid: string; breakRemoveOn?: BreakRemoveOnType }) {
    const { transaction, uid, breakRemoveOn } = options;

    const removeParent = async (nodeUid: string) => {
      const parent = await this.isSingleChild(nodeUid, transaction);

      if (parent && !this.breakOnMatched(parent, breakRemoveOn)) {
        await removeParent(parent.get('x-uid') as string);
      } else {
        await this.remove(nodeUid, { transaction });
      }
    };

    await removeParent(uid);
  }

  private breakOnMatched(schemaInstance, breakRemoveOn: BreakRemoveOnType): boolean {
    if (!breakRemoveOn) {
      return false;
    }

    for (const key of Object.keys(breakRemoveOn)) {
      const instanceValue = schemaInstance.get(key);
      const breakRemoveOnValue = breakRemoveOn[key];
      if (instanceValue !== breakRemoveOnValue) {
        return false;
      }
    }

    return true;
  }

  async recursivelyRemoveIfNoChildren(options: TransactionAble & { uid: string; breakRemoveOn?: BreakRemoveOnType }) {
    const { uid, transaction, breakRemoveOn } = options;

    const removeLeafNode = async (nodeUid: string) => {
      const isLeafNode = await this.isLeafNode(nodeUid, transaction);

      if (isLeafNode) {
        const { parentUid, schema } = await this.findNodeSchemaWithParent(nodeUid, transaction);

        if (this.breakOnMatched(schema, breakRemoveOn)) {
          // break at here
          return;
        } else {
          // remove current node
          await this.remove(nodeUid, {
            transaction,
          });
          // continue remove
          await removeLeafNode(parentUid);
        }
      }
    };

    await removeLeafNode(uid);
  }

  async remove(uid: string, options?: TransactionAble & removeParentOptions) {
    let handleTransaction: boolean = true;
    let transaction;

    if (options?.transaction) {
      transaction = options.transaction;
      handleTransaction = false;
    } else {
      transaction = await this.database.sequelize.transaction();
    }

    try {
      if (options?.removeParentsIfNoChildren) {
        await this.removeEmptyParents({ transaction, uid, breakRemoveOn: options.breakRemoveOn });
        if (handleTransaction) {
          await transaction.commit();
        }
        return;
      }

      await this.database.sequelize.query(
        this.sqlAdapter(`DELETE FROM ${this.uiSchemasTableName} WHERE "x-uid" IN (
            SELECT descendant FROM ${this.uiSchemaTreePathTableName} WHERE ancestor = :uid
        )`),
        {
          replacements: {
            uid,
          },
          transaction,
        },
      );

      await this.database.sequelize.query(
        `
            DELETE FROM ${this.uiSchemaTreePathTableName}
            WHERE descendant IN (
                select descendant FROM
                    (SELECT descendant
                     FROM ${this.uiSchemaTreePathTableName}
                     WHERE ancestor = :uid)as descendantTable) `,
        {
          replacements: {
            uid,
          },
          transaction,
        },
      );

      if (handleTransaction) {
        await transaction.commit();
      }
    } catch (err) {
      if (handleTransaction) {
        await transaction.rollback();
      }
      throw err;
    }
  }

  async insertBeside(targetUid: string, schema: any, side: 'before' | 'after', options?: InsertAdjacentOptions) {
    const targetParent = await this.findParentUid(targetUid);

    const db = this.database;

    const treeTable = this.uiSchemaTreePathTableName;

    const typeQuery = await db.sequelize.query(`SELECT type from ${treeTable} WHERE ancestor = :uid AND depth = 0;`, {
      type: 'SELECT',
      replacements: {
        uid: targetUid,
      },
    });

    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);

    const rootNode = nodes[0];

    rootNode.childOptions = {
      parentUid: targetParent,
      type: typeQuery[0]['type'],
      position: {
        type: side,
        target: targetUid,
      },
    };

    const insertedNodes = await this.insertNodes(nodes, options);
    return await this.getJsonSchema(insertedNodes[0].get('x-uid'));
  }

  async insertInner(targetUid: string, schema: any, position: 'first' | 'last', options?: InsertAdjacentOptions) {
    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    const rootNode = nodes[0];

    rootNode.childOptions = {
      parentUid: targetUid,
      type: lodash.get(schema, 'x-node-type', 'properties'),
      position,
    };

    const insertedNodes = await this.insertNodes(nodes, options);
    return await this.getJsonSchema(insertedNodes[0].get('x-uid'));
  }

  async insertAdjacent(
    position: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd',
    target: string,
    schema: any,
    options?: InsertAdjacentOptions,
  ) {
    return await this[`insert${lodash.upperFirst(position)}`](target, schema, options);
  }

  async insertAfterBegin(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertInner(targetUid, schema, 'first', options);
  }

  async insertBeforeEnd(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertInner(targetUid, schema, 'last', options);
  }

  async insertBeforeBegin(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertBeside(targetUid, schema, 'before', options);
  }

  async insertAfterEnd(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertBeside(targetUid, schema, 'after', options);
  }

  async insertNodes(nodes: SchemaNode[], options?) {
    let handleTransaction: boolean = true;
    let transaction;

    if (options?.transaction) {
      transaction = options.transaction;
      handleTransaction = false;
    } else {
      transaction = await this.database.sequelize.transaction();
    }

    const insertedNodes = [];

    try {
      for (const node of nodes) {
        insertedNodes.push(
          await this.insertSingleNode(node, {
            ...options,
            transaction,
          }),
        );
      }

      if (handleTransaction) {
        await transaction.commit();
      }
      return insertedNodes;
    } catch (err) {
      console.log({ err });
      if (handleTransaction) {
        await transaction.rollback();
      }
      throw err;
    }
  }

  async insert(schema: any, options?: TransactionAble) {
    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    const insertedNodes = await this.insertNodes(nodes, options);
    return this.getJsonSchema(insertedNodes[0].get('x-uid'), {
      transaction: options?.transaction,
    });
  }

  private async insertSchemaRecord(name, uid, schema, transaction) {
    const serverHooks = schema['x-server-hooks'] || [];

    const node = await this.create({
      values: {
        name,
        ['x-uid']: uid,
        schema,
        serverHooks,
      },
      transaction,
      context: {
        disableInsertHook: true,
      },
    });

    return node;
  }

  async insertSingleNode(schema: SchemaNode, options: TransactionAble & removeParentOptions) {
    const { transaction } = options;

    const db = this.database;

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
        'x-uid': uid,
      },
      transaction,
    });

    const treeTable = this.uiSchemaTreePathTableName;

    if (existsNode) {
      savedNode = existsNode;
    } else {
      savedNode = await this.insertSchemaRecord(name, uid, schema, transaction);
    }

    if (childOptions) {
      const oldParentUid = await this.findParentUid(uid, transaction);
      const parentUid = childOptions.parentUid;

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
        // delete old tree path
        await db.sequelize.query(
          `DELETE FROM ${treeTable}
           WHERE descendant IN (SELECT descendant FROM (SELECT descendant FROM ${treeTable} WHERE ancestor = :uid) as descendantTable )
             AND ancestor IN (SELECT ancestor FROM (SELECT ancestor FROM  ${treeTable} WHERE descendant = :uid AND ancestor != descendant) as ancestorTable)
          `,
          {
            type: 'DELETE',
            replacements: {
              uid,
            },
            transaction,
          },
        );

        // insert new tree path
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
          `INSERT INTO ${treeTable} (ancestor, descendant, depth)
           SELECT t.ancestor, :modelKey, depth + 1 FROM ${treeTable} AS t  WHERE t.descendant = :modelParentKey `,
          {
            type: 'INSERT',
            transaction,
            replacements: {
              modelKey: savedNode.get('x-uid'),
              modelParentKey: parentUid,
            },
          },
        );
      }

      if (!existsNode) {
        // insert type && async
        await db.sequelize.query(
          `INSERT INTO ${treeTable}(ancestor, descendant, depth, type, async) VALUES (:modelKey, :modelKey, 0, :type, :async )`,
          {
            type: 'INSERT',
            replacements: {
              modelKey: savedNode.get('x-uid'),
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

        let updateSql = `UPDATE ${treeTable} as TreeTable
                SET sort = TreeTable.sort + 1
                FROM ${treeTable} as NodeInfo
                WHERE NodeInfo.descendant = TreeTable.descendant and NodeInfo.depth = 0
                AND TreeTable.depth = 1 AND TreeTable.ancestor = :ancestor and NodeInfo.type = :type`;

        // Compatible with mysql
        if (this.database.sequelize.getDialect() === 'mysql') {
          updateSql = `UPDATE ${treeTable} as TreeTable 
          JOIN ${treeTable} as NodeInfo ON (NodeInfo.descendant = TreeTable.descendant and NodeInfo.depth = 0)
          SET TreeTable.sort = TreeTable.sort + 1
          WHERE TreeTable.depth = 1 AND TreeTable.ancestor = :ancestor and NodeInfo.type = :type`;
        }

        // move all child last index
        await db.sequelize.query(updateSql, {
          replacements: {
            ancestor: childOptions.parentUid,
            type: childOptions.type,
          },
          transaction,
        });
      }

      if (nodePosition === 'last') {
        const maxSort = await db.sequelize.query(
          `SELECT ${
            this.database.sequelize.getDialect() === 'postgres' ? 'coalesce' : 'ifnull'
          }(MAX(TreeTable.sort), 0) as maxsort FROM ${treeTable} as TreeTable
                                                        LEFT JOIN ${treeTable} as NodeInfo
                                                                  ON NodeInfo.descendant = TreeTable.descendant and NodeInfo.depth = 0
           WHERE TreeTable.depth = 1 AND TreeTable.ancestor = :ancestor and NodeInfo.type = :type`,
          {
            type: 'SELECT',
            replacements: {
              ancestor: childOptions.parentUid,
              type: childOptions.type,
            },
            transaction,
          },
        );

        sort = parseInt(maxSort[0]['maxsort']) + 1;
      }

      if (lodash.isPlainObject(nodePosition)) {
        const targetPosition = nodePosition as TargetPosition;
        const target = targetPosition.target;

        const targetSort = await db.sequelize.query(
          `SELECT TreeTable.sort  as sort FROM ${treeTable} as TreeTable
                                 LEFT JOIN ${treeTable} as NodeInfo
                                           ON NodeInfo.descendant = TreeTable.descendant and NodeInfo.depth = 0   WHERE TreeTable.depth = 1 AND TreeTable.ancestor = :ancestor AND TreeTable.descendant = :descendant and NodeInfo.type = :type`,
          {
            type: 'SELECT',
            replacements: {
              ancestor: childOptions.parentUid,
              descendant: target,
              type: childOptions.type,
            },
            transaction,
          },
        );

        sort = targetSort[0].sort;

        if (targetPosition.type == 'after') {
          sort += 1;
        }

        let updateSql = `UPDATE ${treeTable} as TreeTable
                         SET sort = TreeTable.sort + 1
                             FROM ${treeTable} as NodeInfo
                         WHERE NodeInfo.descendant = TreeTable.descendant
                           and NodeInfo.depth = 0
                           AND TreeTable.depth = 1
                           AND TreeTable.ancestor = :ancestor
                           and TreeTable.sort >= :sort
                           and NodeInfo.type = :type`;

        if (this.database.sequelize.getDialect() === 'mysql') {
          updateSql = `UPDATE  ${treeTable} as TreeTable
JOIN ${treeTable} as NodeInfo ON (NodeInfo.descendant = TreeTable.descendant and NodeInfo.depth = 0)
SET TreeTable.sort = TreeTable.sort + 1
WHERE TreeTable.depth = 1 AND  TreeTable.ancestor = :ancestor and TreeTable.sort >= :sort and NodeInfo.type = :type`;
        }

        await db.sequelize.query(updateSql, {
          replacements: {
            ancestor: childOptions.parentUid,
            sort,
            type: childOptions.type,
          },
          transaction,
        });
      }

      // update order
      const updateSql = `UPDATE ${treeTable} SET sort = :sort WHERE depth = 1 AND ancestor = :ancestor AND descendant = :descendant`;
      await db.sequelize.query(updateSql, {
        type: 'UPDATE',
        replacements: {
          ancestor: childOptions.parentUid,
          sort,
          descendant: uid,
        },
        transaction,
      });

      // move node to new parent
      if (oldParentUid !== null && oldParentUid !== parentUid) {
        await this.database.emitAsync('uiSchemaMove', savedNode, {
          transaction,
          oldParentUid,
          parentUid,
        });

        if (options.removeParentsIfNoChildren) {
          await this.recursivelyRemoveIfNoChildren({
            transaction,
            uid: oldParentUid,
            breakRemoveOn: options.breakRemoveOn,
          });
        }
      }
    } else {
      // insert root node path
      await db.sequelize.query(
        `INSERT INTO ${treeTable}(ancestor, descendant, depth, async) VALUES (:modelKey, :modelKey, 0, :async )`,
        {
          type: 'INSERT',
          replacements: {
            modelKey: savedNode.get('x-uid'),
            async,
          },
          transaction,
        },
      );
    }

    return savedNode;
  }
}

export default UiSchemaRepository;
