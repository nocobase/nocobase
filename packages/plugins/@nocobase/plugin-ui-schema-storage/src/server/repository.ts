/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { Repository, Transaction, Transactionable } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { default as _, default as lodash } from 'lodash';
import { ChildOptions, SchemaNode, TargetPosition } from './dao/ui_schema_node_dao';

export interface GetJsonSchemaOptions {
  includeAsyncNode?: boolean;
  readFromCache?: boolean;
  transaction?: Transaction;
}

export interface GetPropertiesOptions {
  readFromCache?: boolean;
  transaction?: Transaction;
}

type BreakRemoveOnType = {
  [key: string]: any;
};

export interface removeParentOptions extends Transactionable {
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: BreakRemoveOnType;
}

interface InsertAdjacentOptions extends removeParentOptions {
  wrap?: any;
}

const nodeKeys = ['properties', 'definitions', 'patternProperties', 'additionalProperties', 'items'];

function transaction(transactionAbleArgPosition?: number) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      if (!lodash.isNumber(transactionAbleArgPosition)) {
        transactionAbleArgPosition = originalMethod.length - 1;
      }

      let transaction = lodash.get(args, [transactionAbleArgPosition, 'transaction']);
      let handleTransaction = false;
      if (!transaction) {
        transaction = await this.database.sequelize.transaction();
        handleTransaction = true;

        lodash.set(args, transactionAbleArgPosition, {
          ...lodash.get(args, transactionAbleArgPosition, {}),
          transaction,
        });
      }

      if (handleTransaction) {
        try {
          const results = await originalMethod.apply(this, args);
          await transaction.commit();
          return results;
        } catch (e) {
          await transaction.rollback();
          throw e;
        }
      } else {
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export class UiSchemaRepository extends Repository {
  cache: Cache;

  get uiSchemasTableName() {
    return this.tableNameAdapter(this.model.tableName);
  }

  get uiSchemaTreePathTableName() {
    const model = this.database.getCollection('uiSchemaTreePath').model;
    return this.tableNameAdapter(model.tableName);
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
      const childNodeChildOptions = {
        parentUid: node['x-uid'],
        parentPath: [node['x-uid'], ...lodash.get(childOptions, 'parentPath', [])],
        type: nodeKey,
      };

      // array items
      if (nodeKey === 'items' && nodeProperty) {
        const handleItems = lodash.isArray(nodeProperty) ? nodeProperty : [nodeProperty];
        for (const [i, item] of handleItems.entries()) {
          carry = this.schemaToSingleNodes(item, carry, { ...childNodeChildOptions, sort: i + 1 });
        }
      } else if (lodash.isPlainObject(nodeProperty)) {
        const subNodeNames = lodash.keys(lodash.get(node, nodeKey));

        delete node[nodeKey];

        for (const [i, subNodeName] of subNodeNames.entries()) {
          const subSchema = {
            name: subNodeName,
            ...lodash.get(nodeProperty, subNodeName),
          };

          carry = this.schemaToSingleNodes(subSchema, carry, { ...childNodeChildOptions, sort: i + 1 });
        }
      }
    }

    return carry;
  }

  // if you need to handle cache in repo method, so you must set cache first
  setCache(cache: Cache) {
    this.cache = cache;
  }

  /**
   * clear cache with xUid which in uiSchemaTreePath's Path
   * @param {string} xUid
   * @param {Transaction} transaction
   * @returns {Promise<void>}
   */
  async clearXUidPathCache(xUid: string, transaction: Transaction) {
    if (!this.cache || !xUid) {
      return;
    }
    // find all xUid node's parent nodes
    const uiSchemaNodes = await this.database.getRepository('uiSchemaTreePath').find({
      filter: {
        descendant: xUid,
      },
      transaction: transaction,
    });
    for (const uiSchemaNode of uiSchemaNodes) {
      await this.cache.del(`p_${uiSchemaNode['ancestor']}`);
      await this.cache.del(`s_${uiSchemaNode['ancestor']}`);
    }
  }

  tableNameAdapter(tableName) {
    if (this.database.sequelize.getDialect() === 'postgres') {
      return `"${this.database.options.schema || 'public'}"."${tableName}"`;
    }
    return tableName;
  }

  sqlAdapter(sql: string) {
    if (this.database.isMySQLCompatibleDialect()) {
      return lodash.replace(sql, /"/g, '`');
    }

    return sql;
  }

  async getProperties(uid: string, options: GetPropertiesOptions = {}) {
    if (options?.readFromCache && this.cache) {
      return this.cache.wrap(`p_${uid}`, () => {
        return this.doGetProperties(uid, options);
      });
    }
    return this.doGetProperties(uid, options);
  }

  async getParentJsonSchema(uid: string, options: GetJsonSchemaOptions = {}) {
    const parentUid = await this.findParentUid(uid, options.transaction);

    if (!parentUid) {
      return null;
    }

    return this.getJsonSchema(parentUid, options);
  }

  async getParentProperty(uid: string, options: GetPropertiesOptions = {}) {
    const parentUid = await this.findParentUid(uid, options.transaction);

    if (!parentUid) {
      return null;
    }

    return this.getJsonSchema(parentUid, options);
  }

  async getJsonSchema(uid: string, options?: GetJsonSchemaOptions): Promise<any> {
    if (options?.readFromCache && this.cache) {
      return this.cache.wrap(`s_${uid}`, () => {
        return this.doGetJsonSchema(uid, options);
      });
    }
    return this.doGetJsonSchema(uid, options);
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

  @transaction()
  async clearAncestor(uid: string, options?: Transactionable) {
    await this.clearXUidPathCache(uid, options?.transaction);
    const db = this.database;
    const treeTable = this.uiSchemaTreePathTableName;

    await db.sequelize.query(
      `DELETE
       FROM ${treeTable}
       WHERE descendant IN
             (SELECT descendant FROM (SELECT descendant FROM ${treeTable} WHERE ancestor = :uid) as descendantTable)
         AND ancestor IN (SELECT ancestor
                          FROM (SELECT ancestor FROM ${treeTable} WHERE descendant = :uid AND ancestor != descendant) as ancestorTable)
      `,
      {
        type: 'DELETE',
        replacements: {
          uid,
        },
        transaction: options.transaction,
      },
    );
  }

  async emitAfterSaveEvent(s, options) {
    if (!s?.schema) {
      return;
    }
    const keys = ['title', 'description', 'x-component-props.title', 'x-decorator-props.title'];
    let r = false;
    for (const key of keys) {
      if (_.get(s?.schema, key)) {
        r = true;
        break;
      }
    }
    if (r) {
      await this.database.emitAsync(`${this.collection.name}.afterSave`, s, options);
    }
  }

  @transaction()
  async patch(newSchema: any, options?) {
    const { transaction } = options;
    const rootUid = newSchema['x-uid'];
    await this.clearXUidPathCache(rootUid, transaction);
    if (!newSchema['properties']) {
      const s = await this.model.findByPk(rootUid, { transaction });
      s.set('schema', { ...s.toJSON(), ...newSchema });
      await s.save({ transaction, hooks: false });
      await this.emitAfterSaveEvent(s, options);
      if (newSchema['x-server-hooks']) {
        await this.database.emitAsync(`${this.collection.name}.afterSave`, s, options);
      }
      return;
    }
    const oldTree = await this.getJsonSchema(rootUid, { transaction });
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

    await traverSchemaTree(newSchema);
  }

  @transaction()
  async initializeActionContext(newSchema: any, options: any = {}) {
    if (!newSchema['x-uid'] || !newSchema['x-action-context']) {
      return;
    }

    const { transaction } = options;

    const nodeModel = await this.findOne({
      filter: {
        'x-uid': newSchema['x-uid'],
      },
      transaction,
    });

    if (!lodash.isEmpty(nodeModel?.get('schema')['x-action-context'])) {
      return;
    }

    return this.patch(lodash.pick(newSchema, ['x-uid', 'x-action-context']), options);
  }

  @transaction()
  async batchPatch(schemas: any[], options?) {
    const { transaction } = options;
    for (const schema of schemas) {
      await this.patch(schema, { ...options, transaction });
    }
  }

  async removeEmptyParents(options: Transactionable & { uid: string; breakRemoveOn?: BreakRemoveOnType }) {
    const { transaction, uid, breakRemoveOn } = options;

    await this.clearXUidPathCache(uid, transaction);

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

  async recursivelyRemoveIfNoChildren(options: Transactionable & { uid: string; breakRemoveOn?: BreakRemoveOnType }) {
    const { uid, transaction, breakRemoveOn } = options;

    await this.clearXUidPathCache(uid, transaction);

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

  @transaction()
  async remove(uid: string, options?: Transactionable & removeParentOptions) {
    const { transaction } = options;

    await this.clearXUidPathCache(uid, transaction);
    if (options?.removeParentsIfNoChildren) {
      await this.removeEmptyParents({ transaction, uid, breakRemoveOn: options.breakRemoveOn });
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
      ` DELETE FROM ${this.uiSchemaTreePathTableName}
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
  }

  @transaction()
  async insertAdjacent(
    position: 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd',
    target: string,
    schema: any,
    options?: InsertAdjacentOptions,
  ) {
    const { transaction } = options;

    // if schema is existed then clear origin path schema cache
    await this.clearXUidPathCache(schema['x-uid'], transaction);

    if (options.wrap) {
      // insert wrap schema using insertNewSchema
      const wrapSchemaNodes = await this.insertNewSchema(options.wrap, {
        transaction,
        returnNode: true,
      });

      const lastWrapNode = wrapSchemaNodes[wrapSchemaNodes.length - 1];

      // insert schema into wrap schema
      await this.insertAdjacent('afterBegin', lastWrapNode['x-uid'], schema, lodash.omit(options, 'wrap'));

      schema = wrapSchemaNodes[0]['x-uid'];

      options.removeParentsIfNoChildren = false;
    } else {
      const schemaExists = await this.schemaExists(schema, { transaction });

      if (schemaExists) {
        schema = lodash.isString(schema) ? schema : schema['x-uid'];
      } else {
        const insertedSchema = await this.insertNewSchema(schema, {
          transaction,
          returnNode: true,
        });

        schema = insertedSchema[0]['x-uid'];
      }
    }

    const result = await this[`insert${lodash.upperFirst(position)}`](target, schema, options);

    const s = await this.model.findByPk(schema, { transaction });

    await this.emitAfterSaveEvent(s, options);

    // clear target schema path cache
    await this.clearXUidPathCache(result['x-uid'], transaction);

    return result;
  }

  @transaction()
  async duplicate(uid: string, options?: Transactionable) {
    const s = await this.getJsonSchema(uid, { ...options, includeAsyncNode: true });
    if (!s?.['x-uid']) {
      return null;
    }
    this.regenerateUid(s);
    return this.insert(s, options);
  }

  @transaction()
  async insert(schema: any, options?: Transactionable) {
    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    const insertedNodes = await this.insertNodes(nodes, options);
    const result = await this.getJsonSchema(insertedNodes[0].get('x-uid'), {
      transaction: options?.transaction,
    });
    await this.clearXUidPathCache(result['x-uid'], options?.transaction);
    return result;
  }

  @transaction()
  async insertNewSchema(
    schema: any,
    options?: Transactionable & {
      returnNode?: boolean;
    },
  ) {
    const { transaction } = options;

    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    // insert schema fist
    await this.database.sequelize.query(
      this.sqlAdapter(
        `INSERT INTO ${this.uiSchemasTableName} ("x-uid", "name", "schema") VALUES ${nodes
          .map((n) => '(?)')
          .join(',')};`,
      ),
      {
        replacements: lodash.cloneDeep(nodes).map((node) => {
          const { uid, name } = this.prepareSingleNodeForInsert(node);
          return [uid, name, JSON.stringify(node)];
        }),
        type: 'insert',
        transaction,
      },
    );

    const treePathData: Array<any> = lodash.cloneDeep(nodes).reduce((carry, item) => {
      const { uid, childOptions, async } = this.prepareSingleNodeForInsert(item);

      return [
        ...carry,
        // self reference
        [uid, uid, 0, childOptions?.type || null, async, null],
        // parent references
        ...lodash.get(childOptions, 'parentPath', []).map((parentUid, index) => {
          return [parentUid, uid, index + 1, null, null, childOptions.sort];
        }),
      ];
    }, []);

    // insert tree path
    await this.database.sequelize.query(
      this.sqlAdapter(
        `INSERT INTO ${
          this.uiSchemaTreePathTableName
        } (ancestor, descendant, depth, type, async, sort) VALUES ${treePathData.map((item) => '(?)').join(',')}`,
      ),
      {
        replacements: treePathData,
        type: 'insert',
        transaction,
      },
    );

    const rootNode = nodes[0];
    if (rootNode['x-server-hooks']) {
      const rootModel = await this.findOne({ filter: { 'x-uid': rootNode['x-uid'] }, transaction });
      await this.database.emitAsync(`${this.collection.name}.afterCreateWithAssociations`, rootModel, options);
      await this.database.emitAsync(`${this.collection.name}.afterSave`, rootModel, options);
    }

    if (options?.returnNode) {
      return nodes;
    }

    const result = await this.getJsonSchema(nodes[0]['x-uid'], {
      transaction,
    });
    await this.clearXUidPathCache(result['x-uid'], transaction);
    return result;
  }

  async insertSingleNode(schema: SchemaNode, options: Transactionable & removeParentOptions) {
    const { transaction } = options;

    const db = this.database;

    const { uid, name, async, childOptions } = this.prepareSingleNodeForInsert(schema);
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

      const childrenCount = await this.childrenCount(uid, transaction);

      const isTree = childrenCount > 0;

      // if node is a tree root move tree to new path
      if (isTree) {
        await this.clearAncestor(uid, { transaction });

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

      // update type
      await db.sequelize.query(
        `UPDATE ${treeTable} SET type = :type WHERE depth = 0 AND ancestor = :uid AND descendant = :uid`,
        {
          type: 'update',
          transaction,
          replacements: {
            type: childOptions.type,
            uid,
          },
        },
      );

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
        if (this.database.isMySQLCompatibleDialect()) {
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

        if (this.database.isMySQLCompatibleDialect()) {
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
    await this.clearXUidPathCache(uid, transaction);
    return savedNode;
  }

  protected async updateNode(uid: string, schema: any, transaction?: Transaction) {
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

    await this.emitAfterSaveEvent(nodeModel, { transaction });

    if (schema['x-server-hooks']) {
      await this.database.emitAsync(`${this.collection.name}.afterSave`, nodeModel, { transaction });
    }
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

  protected async findParentUid(uid, transaction?) {
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

  @transaction()
  protected async insertBeside(
    targetUid: string,
    schema: any,
    side: 'before' | 'after',
    options?: InsertAdjacentOptions,
  ) {
    const { transaction } = options;
    const targetParent = await this.findParentUid(targetUid, transaction);

    const db = this.database;

    const treeTable = this.uiSchemaTreePathTableName;

    const typeQuery = await db.sequelize.query(`SELECT type from ${treeTable} WHERE ancestor = :uid AND depth = 0;`, {
      type: 'SELECT',
      replacements: {
        uid: targetUid,
      },
      transaction,
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
    return await this.getJsonSchema(insertedNodes[0].get('x-uid'), {
      transaction,
    });
  }

  @transaction()
  protected async insertInner(
    targetUid: string,
    schema: any,
    position: 'first' | 'last',
    options?: InsertAdjacentOptions,
  ) {
    const { transaction } = options;

    const nodes = UiSchemaRepository.schemaToSingleNodes(schema);
    const rootNode = nodes[0];

    rootNode.childOptions = {
      parentUid: targetUid,
      type: lodash.get(schema, 'x-node-type', 'properties'),
      position,
    };

    const insertedNodes = await this.insertNodes(nodes, options);

    return await this.getJsonSchema(insertedNodes[0].get('x-uid'), {
      transaction,
    });
  }

  @transaction()
  protected async insertAfterBegin(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertInner(targetUid, schema, 'first', options);
  }

  @transaction()
  protected async insertBeforeEnd(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertInner(targetUid, schema, 'last', options);
  }

  @transaction()
  protected async insertBeforeBegin(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertBeside(targetUid, schema, 'before', options);
  }

  @transaction()
  protected async insertAfterEnd(targetUid: string, schema: any, options?: InsertAdjacentOptions) {
    return await this.insertBeside(targetUid, schema, 'after', options);
  }

  @transaction()
  protected async insertNodes(nodes: SchemaNode[], options?: Transactionable) {
    const { transaction } = options;

    const insertedNodes = [];

    for (const node of nodes) {
      insertedNodes.push(
        await this.insertSingleNode(node, {
          ...options,
          transaction,
        }),
      );
    }

    return insertedNodes;
  }

  private async doGetProperties(uid: string, options: GetPropertiesOptions = {}) {
    const { transaction } = options;

    const db = this.database;

    const rawSql = `
        SELECT "SchemaTable"."x-uid" as "x-uid", "SchemaTable"."name" as "name", "SchemaTable"."schema" as "schema",
               TreePath.depth as depth,
               NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
        FROM ${this.uiSchemaTreePathTableName} as TreePath
                 LEFT JOIN ${this.uiSchemasTableName} as "SchemaTable" ON "SchemaTable"."x-uid" =  TreePath.descendant
                 LEFT JOIN ${this.uiSchemaTreePathTableName} as NodeInfo ON NodeInfo.descendant = "SchemaTable"."x-uid" and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
                 LEFT JOIN ${this.uiSchemaTreePathTableName} as ParentPath ON (ParentPath.descendant = "SchemaTable"."x-uid" AND ParentPath.depth = 1)
        WHERE TreePath.ancestor = :ancestor  AND (NodeInfo.async = false or TreePath.depth <= 1)`;

    const nodes = await db.sequelize.query(this.sqlAdapter(rawSql), {
      replacements: {
        ancestor: uid,
      },
      transaction,
    });

    if (nodes[0].length == 0) {
      return {};
    }

    const schema = this.nodesToSchema(nodes[0], uid);
    return lodash.pick(schema, ['type', 'properties']);
  }

  private async doGetJsonSchema(uid: string, options?: GetJsonSchemaOptions) {
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
        WHERE TreePath.ancestor = :ancestor  ${
          options?.includeAsyncNode ? '' : 'AND (NodeInfo.async != true or TreePath.depth = 0)'
        }
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

    return this.nodesToSchema(nodes[0], uid);
  }

  private ignoreSchemaProperties(schemaProperties) {
    return lodash.omit(schemaProperties, nodeKeys);
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

  private async schemaExists(schema: any, options?: Transactionable): Promise<boolean> {
    if (lodash.isObject(schema) && !schema['x-uid']) {
      return false;
    }

    const { transaction } = options;
    const result = await this.database.sequelize.query(
      this.sqlAdapter(`select "x-uid" from ${this.uiSchemasTableName} where "x-uid" = :uid`),
      {
        type: 'SELECT',
        replacements: {
          uid: lodash.isString(schema) ? schema : schema['x-uid'],
        },
        transaction,
      },
    );

    return result.length > 0;
  }

  private regenerateUid(s: any) {
    s['x-uid'] = uid();
    Object.keys(s.properties || {}).forEach((key) => {
      this.regenerateUid(s.properties[key]);
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

  private prepareSingleNodeForInsert(schema: SchemaNode) {
    const uid = schema['x-uid'];
    const name = schema['name'];
    const async = lodash.get(schema, 'x-async', false);
    const childOptions = schema['childOptions'];

    delete schema['x-uid'];
    delete schema['x-async'];
    delete schema['name'];
    delete schema['childOptions'];

    return { uid, name, async, childOptions };
  }
}

export default UiSchemaRepository;
