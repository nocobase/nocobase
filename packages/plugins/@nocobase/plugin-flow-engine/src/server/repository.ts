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
import { createHash } from 'node:crypto';
import { QueryTypes } from 'sequelize';
import { ChildOptions, SchemaNode, TargetPosition } from './dao/ui_schema_node_dao';
import {
  acquireEnsureObjectChildLock,
  emitFlowModelTransactionRollback,
  getEnsureObjectChildLockKey,
  getTransactionId,
  isEnsureObjectChildLockOwner,
  registerEnsureObjectChildLockRelease,
} from './flow-models/repository-internals/ensure-lock';
import {
  dedupeNodesForDuplicate,
  replaceStepParamsModelUids,
  stripDuplicateReplayMarker,
} from './flow-models/repository-internals/duplicate-helpers';
import { FlowModelOperationError, isFlowModelUniqueConstraintError } from './flow-models/repository-internals/errors';

export interface GetJsonSchemaOptions {
  includeAsyncNode?: boolean;
  readFromCache?: boolean;
  transaction?: Transaction;
}

export interface GetPropertiesOptions {
  readFromCache?: boolean;
  transaction?: Transaction;
}

export interface FlowModelNodeRecord {
  uid: string;
  name?: string | null;
  options?: unknown;
  depth?: number | null;
  type?: string | null;
  async?: boolean | null;
  parent?: string | null;
  sort?: number | null;
}

type DuplicateUidBuilder = (oldUid: string) => string;

type DuplicateRootOptionsPatch = (options: Record<string, any>) => void;

export type FlowModelAttachPosition = 'first' | 'last' | TargetPosition;

export interface FlowModelAttachOptions {
  parentId: string;
  subKey: string;
  subType: 'array' | 'object';
  position?: FlowModelAttachPosition;
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

export function transaction(transactionAbleArgPosition?: number) {
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
          await emitFlowModelTransactionRollback(this.database, transaction);
          throw e;
        }
      } else {
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export class FlowModelRepository extends Repository {
  cache: Cache;

  get flowModelsTableName() {
    return this.tableNameAdapter(this.model.tableName);
  }

  get flowModelTreePathTableName() {
    const model = this.database.getCollection('flowModelTreePath').model;
    return this.tableNameAdapter(model.tableName);
  }

  static schemaToSingleNodes(schema: any, carry: SchemaNode[] = [], childOptions: ChildOptions = null): SchemaNode[] {
    const node = lodash.cloneDeep(
      lodash.isString(schema)
        ? {
            uid: schema,
          }
        : schema,
    );

    if (!lodash.get(node, 'name')) {
      node.name = uid();
    }

    if (!lodash.get(node, 'uid')) {
      node['uid'] = uid();
    }

    if (childOptions) {
      node.childOptions = childOptions;
    }

    carry.push(node);

    for (const nodeKey of nodeKeys) {
      const nodeProperty = lodash.get(node, nodeKey);
      const childNodeChildOptions = {
        parentUid: node['uid'],
        parentPath: [node['uid'], ...lodash.get(childOptions, 'parentPath', [])],
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
   * clear cache with xUid which in flowModelTreePath's Path
   * @param {string} xUid
   * @param {Transaction} transaction
   * @returns {Promise<void>}
   */
  async clearXUidPathCache(xUid: string, transaction: Transaction) {
    if (!this.cache || !xUid) {
      return;
    }
    // find all xUid node's parent nodes
    const uiSchemaNodes = await this.database.getRepository('flowModelTreePath').find({
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

  static optionsToJson(options: any) {
    return lodash.isPlainObject(options) ? options : JSON.parse(options);
  }

  nodesToSchema(nodes, rootUid) {
    const nodeAttributeSanitize = (node) => {
      const schema = {
        ...this.ignoreSchemaProperties(lodash.isPlainObject(node.options) ? node.options : JSON.parse(node.options)),
        ...lodash.pick(node, [...nodeKeys, 'name']),
        ['uid']: node['uid'],
        ['x-async']: !!node.async,
      };

      if (lodash.isNumber(node.sort)) {
        schema['x-index'] = node.sort;
      }

      return schema;
    };

    const buildTree = (rootNode) => {
      if (!rootNode) {
        return null;
      }
      const children = nodes.filter((node) => node.parent == rootNode['uid']);

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

    return buildTree(nodes.find((node) => node['uid'] == rootUid));
  }

  @transaction()
  async clearAncestor(uid: string, options?: Transactionable) {
    await this.clearXUidPathCache(uid, options?.transaction);
    const db = this.database;
    const treeTable = this.flowModelTreePathTableName;

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
    if (!s?.options) {
      return;
    }
    const keys = [
      'title',
      'description',
      'x-component-props.title',
      'x-decorator-props.title',
      'x-component-props.content',
    ];
    let r = false;
    for (const key of keys) {
      if (_.get(s?.options, key)) {
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
    const rootUid = newSchema['uid'];
    await this.clearXUidPathCache(rootUid, transaction);
    if (!newSchema['properties']) {
      const s = await this.model.findByPk(rootUid, { transaction });
      s.set('options', { ...s.toJSON(), ...newSchema });
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
      const oldNodeUid = oldNode['uid'];

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
    if (!newSchema['uid'] || !newSchema['x-action-context']) {
      return;
    }

    const { transaction } = options;

    const nodeModel = await this.findOne({
      filter: {
        uid: newSchema['uid'],
      },
      transaction,
    });

    if (!lodash.isEmpty(nodeModel?.get('options')['x-action-context'])) {
      return;
    }

    return this.patch(lodash.pick(newSchema, ['uid', 'x-action-context']), options);
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
        await removeParent(parent.get('uid') as string);
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
      this.sqlAdapter(`DELETE FROM ${this.flowModelsTableName} WHERE "uid" IN (
            SELECT descendant FROM ${this.flowModelTreePathTableName} WHERE ancestor = :uid
        )`),
      {
        replacements: {
          uid,
        },
        transaction,
      },
    );

    await this.database.sequelize.query(
      ` DELETE FROM ${this.flowModelTreePathTableName}
            WHERE descendant IN (
                select descendant FROM
                    (SELECT descendant
                     FROM ${this.flowModelTreePathTableName}
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
    await this.clearXUidPathCache(schema['uid'], transaction);

    if (options.wrap) {
      // insert wrap schema using insertNewSchema
      const wrapSchemaNodes = await this.insertNewSchema(options.wrap, {
        transaction,
        returnNode: true,
      });

      const lastWrapNode = wrapSchemaNodes[wrapSchemaNodes.length - 1];

      // insert schema into wrap schema
      await this.insertAdjacent('afterBegin', lastWrapNode['uid'], schema, lodash.omit(options, 'wrap'));

      schema = wrapSchemaNodes[0]['uid'];

      options.removeParentsIfNoChildren = false;
    } else {
      const schemaExists = await this.schemaExists(schema, { transaction });

      if (schemaExists) {
        schema = lodash.isString(schema) ? schema : schema['uid'];
      } else {
        const insertedSchema = await this.insertNewSchema(schema, {
          transaction,
          returnNode: true,
        });

        schema = insertedSchema[0]['uid'];
      }
    }

    const result = await this[`insert${lodash.upperFirst(position)}`](target, schema, options);

    const s = await this.model.findByPk(schema, { transaction });

    await this.emitAfterSaveEvent(s, options);

    // clear target schema path cache
    await this.clearXUidPathCache(result['uid'], transaction);

    return result;
  }

  @transaction()
  async duplicate(modelUid: string, options?: Transactionable) {
    const nodes = await this.prepareNodesForDuplicate(modelUid, { ...options, includeAsyncNode: true });
    if (!nodes.length) {
      return null;
    }

    const duplicatedRootUid = await this.cloneNodesWithUidMap(nodes, {
      sourceUid: modelUid,
      transaction: options?.transaction,
      buildUid: () => uid(),
    });

    return this.findModelById(duplicatedRootUid, { ...options });
  }

  private dedupeNodesForDuplicate(nodes: any[], rootUid: string) {
    return dedupeNodesForDuplicate(nodes, rootUid);
  }

  private replaceStepParamsModelUids(options: any, uidMap: Record<string, string>) {
    return replaceStepParamsModelUids(options, uidMap);
  }

  private sortNodesForDuplicate(nodes: FlowModelNodeRecord[]) {
    return [...nodes].sort((a, b) => {
      if (a.depth !== b.depth) return Number(a.depth ?? 0) - Number(b.depth ?? 0);
      const ap = a.parent || '';
      const bp = b.parent || '';
      if (ap !== bp) return ap < bp ? -1 : 1;
      const at = a.type || '';
      const bt = b.type || '';
      if (at !== bt) return at < bt ? -1 : 1;
      return Number(a.sort ?? 0) - Number(b.sort ?? 0);
    });
  }

  private async prepareNodesForDuplicate(uid: string, options?: GetJsonSchemaOptions): Promise<FlowModelNodeRecord[]> {
    const nodes = await this.findNodesById(uid, { ...options, includeAsyncNode: true });
    if (!nodes.length) {
      return [];
    }
    return this.sortNodesForDuplicate(this.dedupeNodesForDuplicate(nodes, uid));
  }

  private async cloneNodesWithUidMap(
    nodes: FlowModelNodeRecord[],
    options: {
      sourceUid: string;
      transaction?: Transaction;
      buildUid: DuplicateUidBuilder;
      patchRootOptions?: DuplicateRootOptionsPatch;
    },
  ) {
    const uidMap: Record<string, string> = {};
    for (const node of nodes) {
      uidMap[node.uid] = options.buildUid(node.uid);
    }

    for (const node of nodes) {
      const oldUid = node.uid;
      const newUid = uidMap[oldUid];
      const newParentUid = node.parent ? uidMap[node.parent] ?? null : null;
      const optionsObj = this.replaceStepParamsModelUids(
        lodash.cloneDeep(FlowModelRepository.optionsToJson(node.options ?? {})),
        uidMap,
      );

      if (oldUid === options.sourceUid) {
        options.patchRootOptions?.(optionsObj);
      }

      if (newParentUid) {
        optionsObj.parent = newParentUid;
        optionsObj.parentId = newParentUid;
      }

      const schemaNode: SchemaNode = {
        uid: newUid,
        ['x-async']: !!node.async,
        ...optionsObj,
      };

      if (newParentUid) {
        schemaNode.childOptions = {
          parentUid: newParentUid,
          type: node.type,
          position: 'last',
        };
      }

      await this.insertSingleNode(schemaNode, { transaction: options.transaction });
    }

    return uidMap[options.sourceUid];
  }

  @transaction()
  async insert(schema: any, options?: Transactionable) {
    const nodes = FlowModelRepository.schemaToSingleNodes(schema);
    const insertedNodes = await this.insertNodes(nodes, options);
    const result = await this.getJsonSchema(insertedNodes[0].get('uid'), {
      transaction: options?.transaction,
    });
    await this.clearXUidPathCache(result['uid'], options?.transaction);
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

    const nodes = FlowModelRepository.schemaToSingleNodes(schema);
    // insert schema fist
    await this.database.sequelize.query(
      this.sqlAdapter(
        `INSERT INTO ${this.flowModelsTableName} ("uid", "name", "options") VALUES ${nodes
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
          this.flowModelTreePathTableName
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
      const rootModel = await this.findOne({ filter: { uid: rootNode['uid'] }, transaction });
      await this.database.emitAsync(`${this.collection.name}.afterCreateWithAssociations`, rootModel, options);
      await this.database.emitAsync(`${this.collection.name}.afterSave`, rootModel, options);
    }

    if (options?.returnNode) {
      return nodes;
    }

    const result = await this.getJsonSchema(nodes[0]['uid'], {
      transaction,
    });
    await this.clearXUidPathCache(result['uid'], transaction);
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
        uid: uid,
      },
      transaction,
    });

    const treeTable = this.flowModelTreePathTableName;

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
              modelKey: savedNode.get('uid'),
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
        // await this.database.emitAsync('uiSchemaMove', savedNode, {
        //   transaction,
        //   oldParentUid,
        //   parentUid,
        // });

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
            modelKey: savedNode.get('uid'),
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
        uid: uid,
      },
    });

    await nodeModel.update(
      {
        options: {
          ...(nodeModel.get('options') as any),
          ...lodash.omit(schema, ['x-async', 'name', 'uid', 'properties']),
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
      `SELECT COUNT(*) as count FROM ${this.flowModelTreePathTableName} where ancestor = :ancestor and depth  = 1`,
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
    const parent = await this.database.getRepository('flowModelTreePath').findOne({
      filter: {
        descendant: uid,
        depth: 1,
      },
      transaction,
    });

    return parent ? (parent.get('ancestor') as string) : null;
  }

  protected async findNodeSchemaWithParent(uid, transaction) {
    const schema = await this.database.getRepository('flowModels').findOne({
      filter: {
        uid: uid,
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
      const schema = await db.getRepository('flowModels').findOne({
        filter: {
          uid: parent,
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

    const treeTable = this.flowModelTreePathTableName;

    const typeQuery = await db.sequelize.query(`SELECT type from ${treeTable} WHERE ancestor = :uid AND depth = 0;`, {
      type: 'SELECT',
      replacements: {
        uid: targetUid,
      },
      transaction,
    });

    const nodes = FlowModelRepository.schemaToSingleNodes(schema);

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
    return await this.getJsonSchema(insertedNodes[0].get('uid'), {
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

    const nodes = FlowModelRepository.schemaToSingleNodes(schema);
    const rootNode = nodes[0];

    rootNode.childOptions = {
      parentUid: targetUid,
      type: lodash.get(schema, 'x-node-type', 'properties'),
      position,
    };

    const insertedNodes = await this.insertNodes(nodes, options);

    return await this.getJsonSchema(insertedNodes[0].get('uid'), {
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
        SELECT "SchemaTable"."uid" as "uid", "SchemaTable"."name" as "name", "SchemaTable"."options" as "options",
               TreePath.depth as depth,
               NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
        FROM ${this.flowModelTreePathTableName} as TreePath
                 LEFT JOIN ${this.flowModelsTableName} as "SchemaTable" ON "SchemaTable"."uid" =  TreePath.descendant
                 LEFT JOIN ${this.flowModelTreePathTableName} as NodeInfo ON NodeInfo.descendant = "SchemaTable"."uid" and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
                 LEFT JOIN ${this.flowModelTreePathTableName} as ParentPath ON (ParentPath.descendant = "SchemaTable"."uid" AND ParentPath.depth = 1)
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

  async findNodesById(uid: string, options?: GetJsonSchemaOptions): Promise<FlowModelNodeRecord[]> {
    const db = this.database;

    const treeTable = this.flowModelTreePathTableName;

    const rawSql = `
        SELECT "SchemaTable"."uid" as "uid", "SchemaTable"."name" as name, "SchemaTable"."options" as "options" ,
               TreePath.depth as depth,
               NodeInfo.type as type, NodeInfo.async as async,  ParentPath.ancestor as parent, ParentPath.sort as sort
        FROM ${treeTable} as TreePath
                 LEFT JOIN ${this.flowModelsTableName} as "SchemaTable" ON "SchemaTable"."uid" =  TreePath.descendant
                 LEFT JOIN ${treeTable} as NodeInfo ON NodeInfo.descendant = "SchemaTable"."uid" and NodeInfo.descendant = NodeInfo.ancestor and NodeInfo.depth = 0
                 LEFT JOIN ${treeTable} as ParentPath ON (ParentPath.descendant = "SchemaTable"."uid" AND ParentPath.depth = 1)
        WHERE TreePath.ancestor = :ancestor  ${
          options?.includeAsyncNode ? '' : 'AND (NodeInfo.async != true or TreePath.depth = 0)'
        }
    `;

    const nodes = await db.sequelize.query<FlowModelNodeRecord>(this.sqlAdapter(rawSql), {
      replacements: {
        ancestor: uid,
      },
      type: QueryTypes.SELECT,
      transaction: options?.transaction,
    });

    if (nodes.length === 0) {
      return [];
    }

    return nodes;
  }

  private async doGetJsonSchema(uid: string, options?: GetJsonSchemaOptions) {
    const nodes = await this.findNodesById(uid, options);
    return this.nodesToSchema(nodes, uid);
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
    if (lodash.isObject(schema) && !schema['uid']) {
      return false;
    }

    const { transaction } = options;
    const result = await this.database.sequelize.query(
      this.sqlAdapter(`select "uid" from ${this.flowModelsTableName} where "uid" = :uid`),
      {
        type: 'SELECT',
        replacements: {
          uid: lodash.isString(schema) ? schema : schema['uid'],
        },
        transaction,
      },
    );

    return result.length > 0;
  }

  private regenerateUid(s: any) {
    s['uid'] = uid();
    Object.keys(s.properties || {}).forEach((key) => {
      this.regenerateUid(s.properties[key]);
    });
  }

  private async insertSchemaRecord(name, uid, schema, transaction) {
    const node = await this.create({
      values: {
        name,
        ['uid']: uid,
        options: schema,
      },
      transaction,
      context: {
        disableInsertHook: true,
      },
    });

    return node;
  }

  private prepareSingleNodeForInsert(schema: SchemaNode) {
    const uid = schema['uid'];
    const name = schema['name'];
    const async = lodash.get(schema, 'x-async', false);
    const childOptions = schema['childOptions'];

    delete schema['uid'];
    delete schema['x-async'];
    delete schema['name'];
    delete schema['childOptions'];

    return { uid, name, async, childOptions };
  }

  static modelToSingleNodes(model, parentChildOptions = null): SchemaNode[] {
    const { uid: oldUid, async, subModels, ...rest } = _.cloneDeep(model);
    const currentUid = oldUid || uid();
    const node = {
      uid: currentUid,
      'x-async': async || false,
      name: currentUid,
      ...rest,
    };
    if (parentChildOptions) {
      node.childOptions = parentChildOptions;
    }
    const nodes = [node];
    if (Object.keys(subModels || {}).length > 0) {
      for (const [subKey, subItems] of Object.entries(subModels)) {
        const items = _.castArray<any>(subItems);
        let sort = 0;
        for (const item of items) {
          item.subKey = subKey;
          item.subType = Array.isArray(subItems) ? 'array' : 'object';
          const childOptions = {
            parentUid: currentUid,
            parentPath: [currentUid, ...(parentChildOptions?.parentPath || [])].filter(Boolean),
            type: subKey,
            // type: 'properties',
            sort: ++sort,
          };
          const children = this.modelToSingleNodes(item, childOptions);
          nodes.push(...children);
        }
      }
    }
    return nodes;
  }

  static nodeToModel(node) {
    const { uid: uid, name, options } = node;
    const model = {
      uid,
      ...stripDuplicateReplayMarker(this.optionsToJson(options)),
      async: !!node?.async,
    };
    return model;
  }

  static nodesToModel(nodes: any[], rootUid: string) {
    // 1. 建立 uid 到 node 的映射
    const nodeMap = new Map<string, any>();
    for (const node of nodes) {
      nodeMap.set(node['uid'], node);
    }

    // 2. 找到 root 节点
    const rootNode = nodeMap.get(rootUid);
    if (!rootNode) return null;

    // 3. 找到所有子节点
    const children = nodes.filter((n) => n.parent === rootUid);

    // 4. 按 subKey 分组并递归
    const subModels: Record<string, any> = {};

    for (const child of children) {
      const { subKey, subType } = this.optionsToJson(child.options);
      if (!subKey) continue;
      // 递归处理子节点
      const model: any = FlowModelRepository.nodesToModel(nodes, child['uid']) || {
        uid: child['uid'],
        ...stripDuplicateReplayMarker(this.optionsToJson(child.options)),
        async: !!child?.async,
        sortIndex: child.sort,
      };
      // 保证 sortIndex
      model.sortIndex = child.sort;
      if (subType === 'array') {
        if (!subModels[subKey]) subModels[subKey] = [];
        subModels[subKey].push(model);
      } else {
        subModels[subKey] = model;
      }
    }

    // 5. 对数组类型的 subModels 排序
    for (const key in subModels) {
      if (Array.isArray(subModels[key])) {
        subModels[key].sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
      }
    }

    // 6. 过滤掉空对象 subModels
    const filteredSubModels: Record<string, any> = {};
    for (const key in subModels) {
      const value = subModels[key];
      if (Array.isArray(value) && value.length === 0) continue;
      if (!Array.isArray(value) && typeof value === 'object' && value !== null && Object.keys(value).length === 0)
        continue;
      filteredSubModels[key] = value;
    }

    // 7. 返回最终 model
    return {
      uid: rootNode['uid'],
      ...stripDuplicateReplayMarker(this.optionsToJson(rootNode.options)),
      async: !!rootNode?.async,
      ...(Object.keys(filteredSubModels).length > 0 ? { subModels: filteredSubModels } : {}),
    };
  }

  @transaction()
  async insertModel(model: any, options?: Transactionable) {
    const nodes = FlowModelRepository.modelToSingleNodes(model);
    const rootUid = nodes[0]['uid'];
    await this.insertNodes(nodes, options);
    return await this.findModelById(rootUid, options);
  }

  @transaction()
  async updateSingleNode(node: SchemaNode, options?: Transactionable) {
    const instance = await this.model.findByPk(node['uid'], {
      transaction: options?.transaction,
    });
    if (instance) {
      // @ts-ignore
      await instance.update(
        {
          options: {
            ...(instance.get('options') as any),
            ...lodash.omit(node, ['x-async', 'name', 'uid', 'childOptions']),
          },
        },
        {
          hooks: false,
          transaction: options?.transaction,
        },
      );
      return true;
    }
    return false;
  }

  @transaction()
  async upsertModel(model: any, options?: Transactionable) {
    let childOptions: ChildOptions = null;
    if (model.parentId) {
      childOptions = {
        parentUid: model.parentId,
        type: model.subKey,
        // type: 'properties',
        position: 'last',
      };
    }
    const nodes = FlowModelRepository.modelToSingleNodes(model, childOptions);
    const rootUid = nodes[0]['uid'];
    for (const node of nodes) {
      const exists = await this.updateSingleNode(node, options);
      if (!exists) {
        await this.insertSingleNode(node, options);
      }
    }
    return rootUid;
  }

  async findModelById(uid: string, options?: GetJsonSchemaOptions) {
    const nodes = await this.findNodesById(uid, options);
    return FlowModelRepository.nodesToModel(nodes, uid);
  }

  async findModelByParentId(parentUid: string, options?: GetJsonSchemaOptions & { subKey?: string }) {
    const r = this.database.getRepository('flowModelTreePath');
    const treePaths = await r.model.findAll({
      where: {
        ancestor: parentUid,
        depth: 1,
      },
      transaction: options?.transaction,
    });
    const ancestors = treePaths.map((treePath) => treePath['descendant']);
    const where = {
      ancestor: ancestors,
      depth: 0,
    };
    if (options?.subKey) {
      where['type'] = options.subKey;
    }
    const treePath = await r.model.findOne({
      where,
      transaction: options?.transaction,
    });
    if (treePath?.['descendant']) {
      // if parentUid is a leaf node, return the first child
      return this.findModelById(treePath['descendant'], options);
    }
    return null;
  }

  @transaction()
  async ensureModel(
    values: any,
    options?: Transactionable & {
      includeAsyncNode?: boolean;
    },
  ) {
    const includeAsyncNode = !!options?.includeAsyncNode;
    const { transaction } = options || {};

    const uidValue = String(values?.uid || '').trim();
    const parentIdValue = String(values?.parentId || '').trim();
    const subKeyValue = String(values?.subKey || '').trim();
    const subTypeValue = values?.subType;

    const hasUidLocator = !!uidValue;
    const hasObjectChildLocator = !!parentIdValue || !!subKeyValue || subTypeValue !== undefined;

    if (hasUidLocator && hasObjectChildLocator) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: "flowModels:ensure requires either 'uid' OR ('parentId'+'subKey'+'subType=object'), not both",
      });
    }

    if (!hasUidLocator && !hasObjectChildLocator) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: "flowModels:ensure missing locator: provide 'uid' OR ('parentId'+'subKey'+'subType=object')",
      });
    }

    if (uidValue) {
      const exists = await this.model.findByPk(uidValue, { transaction });
      if (exists) {
        return await this.findModelById(uidValue, { transaction, includeAsyncNode });
      }

      const use = String(values?.use || '').trim();
      if (!use) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: "flowModels:ensure missing required field 'use' when creating by uid",
        });
      }

      try {
        const modelToEnsure = {
          ..._.cloneDeep(values),
          uid: uidValue,
          use,
        };
        await this.database.sequelize.transaction({ transaction }, async (innerTransaction) => {
          await this.upsertModel(modelToEnsure, { transaction: innerTransaction });
        });
      } catch (error) {
        // retry-safety for concurrent ensure by the same uid
        if (isFlowModelUniqueConstraintError(error)) {
          const createdByOther = await this.model.findByPk(uidValue, { transaction });
          if (createdByOther) {
            return await this.findModelById(uidValue, { transaction, includeAsyncNode });
          }
        }
        throw error;
      }
      return await this.findModelById(uidValue, { transaction, includeAsyncNode });
    }

    // object child ensure: parentId + subKey + subType=object
    if (!parentIdValue || !subKeyValue || subTypeValue !== 'object') {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: "flowModels:ensure by parent requires 'parentId'+'subKey' and 'subType' must be 'object'",
      });
    }

    const ensureObjectChild = async () => {
      const supportsForUpdate =
        this.database.sequelize.getDialect() === 'postgres' || this.database.isMySQLCompatibleDialect();

      // lock parent row to make ensure concurrent-safe (best effort for dialects that don't support FOR UPDATE)
      const lockedParent = await this.database.sequelize.query(
        this.sqlAdapter(
          `SELECT "uid" FROM ${this.flowModelsTableName} WHERE "uid" = :uid${supportsForUpdate ? ' FOR UPDATE' : ''}`,
        ),
        {
          type: 'SELECT',
          replacements: { uid: parentIdValue },
          transaction,
        },
      );
      if (!lockedParent?.length) {
        throw new FlowModelOperationError({
          status: 404,
          code: 'NOT_FOUND',
          message: `flowModels:ensure parentId '${parentIdValue}' not found`,
        });
      }

      const treeTable = this.flowModelTreePathTableName;
      const existingChildren = await this.database.sequelize.query<{ uid: string }>(
        `SELECT TreeTable.descendant as uid
         FROM ${treeTable} as TreeTable
                  LEFT JOIN ${treeTable} as NodeInfo
                            ON NodeInfo.descendant = TreeTable.descendant
                                AND NodeInfo.depth = 0
         WHERE TreeTable.depth = 1
           AND TreeTable.ancestor = :ancestor
           AND NodeInfo.type = :type
         ORDER BY TreeTable.sort ASC`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            ancestor: parentIdValue,
            type: subKeyValue,
          },
          transaction,
        },
      );

      if (existingChildren?.length) {
        if (existingChildren.length > 1) {
          this.database.logger.warn('flowModels:ensure found duplicate object children; using first child', {
            action: 'flowModels:ensure',
            type: 'flow-model-duplicate-object-child',
            parentId: parentIdValue,
            subKey: subKeyValue,
            childUids: existingChildren.map((child) => String(child?.uid || '').trim()).filter(Boolean),
          });
        }

        const existingChild = existingChildren.at(0);
        const childUid = String(existingChild?.uid ?? '').trim();
        if (!childUid) {
          throw new FlowModelOperationError({
            status: 500,
            code: 'INTERNAL_ERROR',
            message: 'flowModels:ensure failed to resolve existing child uid',
          });
        }

        const childInstance = await this.model.findByPk(childUid, { transaction });
        if (!childInstance) {
          throw new FlowModelOperationError({
            status: 500,
            code: 'INTERNAL_ERROR',
            message: `flowModels:ensure child uid '${childUid}' not found`,
          });
        }

        const childOptions = FlowModelRepository.optionsToJson(childInstance.get('options'));
        if (childOptions?.subType && childOptions.subType !== 'object') {
          throw new FlowModelOperationError({
            status: 409,
            code: 'CONFLICT',
            message: `flowModels:ensure object subKey '${subKeyValue}' conflicts with existing subType '${childOptions.subType}'`,
          });
        }

        return await this.findModelById(childUid, { transaction, includeAsyncNode });
      }

      const use = String(values?.use || '').trim();
      if (!use) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: "flowModels:ensure missing required field 'use' when creating object child model",
        });
      }

      const newUid = `ens_${createHash('sha256')
        .update(`${parentIdValue}\u0000${subKeyValue}\u0000object`)
        .digest('hex')
        .slice(0, 24)}`;

      try {
        const modelToEnsure = {
          ..._.cloneDeep(values),
          uid: newUid,
          parentId: parentIdValue,
          subKey: subKeyValue,
          subType: 'object',
          use,
        };
        await this.database.sequelize.transaction({ transaction }, async (innerTransaction) => {
          await this.upsertModel(modelToEnsure, { transaction: innerTransaction });
        });
      } catch (error) {
        // retry-safety for concurrent ensure on dialects without row locks (or cross-instance races)
        if (isFlowModelUniqueConstraintError(error)) {
          const existing = await this.database.sequelize.query<{ uid: string }>(
            `SELECT TreeTable.descendant as uid
             FROM ${treeTable} as TreeTable
                      LEFT JOIN ${treeTable} as NodeInfo
                                ON NodeInfo.descendant = TreeTable.descendant
                                    AND NodeInfo.depth = 0
             WHERE TreeTable.depth = 1
               AND TreeTable.ancestor = :ancestor
               AND NodeInfo.type = :type
             ORDER BY TreeTable.sort ASC`,
            {
              type: QueryTypes.SELECT,
              replacements: {
                ancestor: parentIdValue,
                type: subKeyValue,
              },
              transaction,
            },
          );
          if (existing?.length) {
            const existingChild = existing.at(0);
            const childUid = String(existingChild?.uid ?? '').trim();
            if (childUid) {
              return await this.findModelById(childUid, { transaction, includeAsyncNode });
            }
          }
        }
        throw error;
      }

      return await this.findModelById(newUid, { transaction, includeAsyncNode });
    };

    const lockKey = getEnsureObjectChildLockKey(parentIdValue, subKeyValue);

    if (isEnsureObjectChildLockOwner(lockKey, transaction)) {
      return await ensureObjectChild();
    }

    const releaseEnsureObjectChildLock = await acquireEnsureObjectChildLock(lockKey, getTransactionId(transaction));
    let releaseEnsureObjectChildLockAfterTransaction = false;

    try {
      const model = await ensureObjectChild();

      if (registerEnsureObjectChildLockRelease(this.database, transaction, releaseEnsureObjectChildLock)) {
        releaseEnsureObjectChildLockAfterTransaction = true;
      }

      return model;
    } finally {
      if (!releaseEnsureObjectChildLockAfterTransaction) {
        releaseEnsureObjectChildLock();
      }
    }
  }

  @transaction()
  async attach(uid: string, attachOptions: FlowModelAttachOptions, options?: Transactionable) {
    const { transaction } = options || {};
    const modelUid = String(uid || '').trim();
    const parentId = String(attachOptions?.parentId || '').trim();
    const subKey = String(attachOptions?.subKey || '').trim();
    const subType = attachOptions?.subType;

    if (!modelUid || !parentId || !subKey || (subType !== 'array' && subType !== 'object')) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: 'flowModels:attach missing required params',
      });
    }
    if (modelUid === parentId) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: 'flowModels:attach cannot attach model to itself',
      });
    }

    const treeTable = this.flowModelTreePathTableName;

    const modelInstance = await this.model.findByPk(modelUid, { transaction });
    if (!modelInstance) {
      throw new FlowModelOperationError({
        status: 404,
        code: 'NOT_FOUND',
        message: `flowModels:attach uid '${modelUid}' not found`,
      });
    }
    const parentInstance = await this.model.findByPk(parentId, { transaction });
    if (!parentInstance) {
      throw new FlowModelOperationError({
        status: 404,
        code: 'NOT_FOUND',
        message: `flowModels:attach parentId '${parentId}' not found`,
      });
    }

    // 环检测：禁止将祖先挂到其子孙节点下
    const cycle = await this.database.sequelize.query(
      `SELECT 1 as v
       FROM ${treeTable}
       WHERE ancestor = :ancestor AND descendant = :descendant AND depth > 0
       LIMIT 1`,
      {
        type: 'SELECT',
        replacements: {
          ancestor: modelUid,
          descendant: parentId,
        },
        transaction,
      },
    );
    if (cycle?.length) {
      throw new FlowModelOperationError({
        status: 409,
        code: 'CYCLE_DETECTED',
        message: 'flowModels:attach cycle detected',
      });
    }

    // object 子模型：同一 parent + subKey 只能存在一个
    if (subType === 'object') {
      const conflict = await this.database.sequelize.query(
        `SELECT TreeTable.descendant as uid
         FROM ${treeTable} as TreeTable
                  LEFT JOIN ${treeTable} as NodeInfo
                            ON NodeInfo.descendant = TreeTable.descendant
                                AND NodeInfo.depth = 0
         WHERE TreeTable.depth = 1
           AND TreeTable.ancestor = :ancestor
           AND NodeInfo.type = :type
           AND TreeTable.descendant != :uid
         LIMIT 1`,
        {
          type: 'SELECT',
          replacements: {
            ancestor: parentId,
            type: subKey,
            uid: modelUid,
          },
          transaction,
        },
      );
      if (conflict?.length) {
        throw new FlowModelOperationError({
          status: 409,
          code: 'CONFLICT',
          message: `flowModels:attach subKey '${subKey}' already exists on parent '${parentId}'`,
        });
      }
    }

    const normalizePosition = (input: unknown): FlowModelAttachPosition => {
      if (!input) return 'last';
      if (input === 'first' || input === 'last') return input;
      if (typeof input === 'object') {
        const p = input as any;
        const type = p?.type;
        const target = String(p?.target || '').trim();
        if ((type === 'before' || type === 'after') && target) {
          return { type, target };
        }
      }
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: 'flowModels:attach invalid position',
      });
    };

    const position: FlowModelAttachPosition =
      subType === 'object' ? 'last' : normalizePosition(attachOptions?.position as any);

    // 目标排序锚点校验：before/after 必须是同 parent + subKey 下的兄弟节点
    if (typeof position === 'object') {
      const target = String(position.target || '').trim();
      if (target === modelUid) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: 'flowModels:attach position target cannot be itself',
        });
      }

      const ok = await this.database.sequelize.query(
        `SELECT 1 as v
         FROM ${treeTable} as TreeTable
                  LEFT JOIN ${treeTable} as NodeInfo
                            ON NodeInfo.descendant = TreeTable.descendant
                                AND NodeInfo.depth = 0
         WHERE TreeTable.depth = 1
           AND TreeTable.ancestor = :ancestor
           AND TreeTable.descendant = :descendant
           AND NodeInfo.type = :type
         LIMIT 1`,
        {
          type: 'SELECT',
          replacements: {
            ancestor: parentId,
            descendant: target,
            type: subKey,
          },
          transaction,
        },
      );
      if (!ok?.length) {
        throw new FlowModelOperationError({
          status: 400,
          code: 'INVALID_PARAMS',
          message: 'flowModels:attach position target is not a sibling under the same parent/subKey',
        });
      }
    }

    // 清理旧路径缓存（旧祖先）
    await this.clearXUidPathCache(modelUid, transaction);

    // 更新 root options：确保 nodesToModel 能按 subKey/subType 正确挂载
    await modelInstance.update(
      {
        options: {
          ...(modelInstance.get('options') as any),
          parentId,
          parent: parentId,
          subKey,
          subType,
        },
      },
      { transaction, hooks: false },
    );

    // 更新 tree path：移动（move）语义
    await this.insertSingleNode(
      {
        uid: modelUid,
        name: modelUid,
        childOptions: {
          parentUid: parentId,
          type: subKey,
          position,
        },
      } as any,
      { transaction, removeParentsIfNoChildren: false },
    );

    return await this.findModelById(modelUid, { transaction, includeAsyncNode: true });
  }

  @transaction()
  async duplicateWithTargetUid(
    modelUid: string,
    targetUid: string,
    options?: Transactionable & {
      includeAsyncNode?: boolean;
    },
  ) {
    const sourceUid = String(modelUid || '').trim();
    const desiredUid = String(targetUid || '').trim();
    const includeAsyncNode = !!options?.includeAsyncNode;
    const { transaction } = options || {};

    if (!sourceUid || !desiredUid) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: "flowModels:mutate duplicate requires 'uid' and 'targetUid'",
      });
    }

    const targetInstance = await this.model.findByPk(desiredUid, { transaction });
    if (targetInstance) {
      const targetOptions = FlowModelRepository.optionsToJson(targetInstance.get('options'));
      const marker = targetOptions?.__mutateDuplicate;
      if (marker?.sourceUid === sourceUid) {
        return await this.findModelById(desiredUid, { transaction, includeAsyncNode });
      }
      throw new FlowModelOperationError({
        status: 409,
        code: 'CONFLICT',
        message: `flowModels:mutate duplicate targetUid '${desiredUid}' already exists`,
      });
    }

    const nodes = await this.prepareNodesForDuplicate(sourceUid, { ...options, includeAsyncNode: true });
    if (!nodes.length) {
      throw new FlowModelOperationError({
        status: 404,
        code: 'NOT_FOUND',
        message: `flowModels:mutate duplicate uid '${sourceUid}' not found`,
      });
    }

    const buildUid = (root: string, old: string) => {
      if (old === sourceUid) return root;
      const h = createHash('sha256').update(`${root}:${old}`).digest('hex').slice(0, 24);
      return `d_${h}`;
    };

    try {
      await this.cloneNodesWithUidMap(nodes, {
        sourceUid,
        transaction,
        buildUid: (oldUid) => buildUid(desiredUid, oldUid),
        patchRootOptions: (rootOptions) => {
          rootOptions.__mutateDuplicate = { sourceUid };
        },
      });
    } catch (error) {
      if (isFlowModelUniqueConstraintError(error)) {
        const existingTarget = await this.model.findByPk(desiredUid, { transaction });
        if (existingTarget) {
          const targetOptions = FlowModelRepository.optionsToJson(existingTarget.get('options'));
          const marker = targetOptions?.__mutateDuplicate;
          if (marker?.sourceUid === sourceUid) {
            return await this.findModelById(desiredUid, { transaction, includeAsyncNode });
          }
        }

        throw new FlowModelOperationError({
          status: 409,
          code: 'CONFLICT',
          message: `flowModels:mutate duplicate targetUid '${desiredUid}' already exists`,
        });
      }
      throw error;
    }

    return await this.findModelById(desiredUid, { transaction, includeAsyncNode });
  }

  @transaction()
  async move(
    moveOptions: { sourceId: string; targetId: string; position: 'before' | 'after' },
    options?: Transactionable,
  ) {
    const { transaction } = options || {};
    const sourceId = String(moveOptions?.sourceId || '').trim();
    const targetId = String(moveOptions?.targetId || '').trim();
    const position = moveOptions?.position;

    if (!sourceId || !targetId || (position !== 'before' && position !== 'after')) {
      throw new FlowModelOperationError({
        status: 400,
        code: 'INVALID_PARAMS',
        message: "flowModels:move requires 'sourceId'+'targetId'+'position=before|after'",
      });
    }

    if (sourceId === targetId) {
      const currentModel = await this.findModelById(sourceId, { transaction, includeAsyncNode: true });
      if (currentModel) {
        return currentModel;
      }
    }

    return await this.insertAdjacent(
      position === 'after' ? 'afterEnd' : 'beforeBegin',
      targetId,
      {
        ['uid']: sourceId,
      },
      { transaction },
    );
  }
}

export default FlowModelRepository;
