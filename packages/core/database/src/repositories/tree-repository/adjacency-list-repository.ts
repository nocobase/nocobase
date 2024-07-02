/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { FindOptions, Repository } from '../../repository';
import Database from '../../database';
import { Collection } from '../../collection';
import { Model } from '../../model';
import { FindAndCountOptions, QueryTypes } from 'sequelize';
import { assign } from '@nocobase/utils';

export class AdjacencyListRepository extends Repository {
  static queryParentSQL(options: {
    db: Database;
    nodeIds: any[];
    collection: Collection;
    foreignKey: string;
    targetKey: string;
  }) {
    const { collection, db, nodeIds } = options;
    const tableName = collection.quotedTableName();
    const { foreignKey, targetKey } = options;
    const foreignKeyField = collection.model.rawAttributes[foreignKey].field;
    const targetKeyField = collection.model.rawAttributes[targetKey].field;

    const queryInterface = db.sequelize.getQueryInterface();
    const q = queryInterface.quoteIdentifier.bind(queryInterface);
    return `WITH RECURSIVE cte AS (
      SELECT ${q(targetKeyField)}, ${q(foreignKeyField)}
      FROM ${tableName}
      WHERE ${q(targetKeyField)} IN (${nodeIds.join(',')})
      UNION ALL
      SELECT t.${q(targetKeyField)}, t.${q(foreignKeyField)}
      FROM ${tableName} AS t
      INNER JOIN cte ON t.${q(targetKeyField)} = cte.${q(foreignKeyField)}
      )
      SELECT ${q(targetKeyField)} AS ${q(targetKey)}, ${q(foreignKeyField)} AS ${q(foreignKey)} FROM cte`;
  }

  async update(options): Promise<any> {
    return super.update({
      ...(options || {}),
      addIndex: false,
    });
  }

  async find(options: FindOptions & { addIndex?: boolean } = {}): Promise<any> {
    // if (options.raw || !options.tree) {
    //   return await super.find(options);
    // }

    const collection = this.collection;
    const primaryKey = collection.model.primaryKeyAttribute;

    if (options.fields && !options.fields.includes(primaryKey)) {
      options.fields.push(primaryKey);
    }

    const parentNodes = await super.find(options);
    if (parentNodes.length === 0) {
      return [];
    }

    const { treeParentField } = collection;
    const foreignKey = treeParentField.options.foreignKey;

    const childrenKey = collection.treeChildrenField?.name ?? 'children';

    const parentIds = parentNodes.map((node) => node[primaryKey]);

    if (parentIds.length == 0) {
      this.database.logger.warn('parentIds is empty');
      return parentNodes;
    }

    const sql = this.querySQL(parentIds, collection);

    const childNodes = await this.database.sequelize.query(sql, {
      type: 'SELECT',
      transaction: options.transaction,
    });

    const childIds = childNodes.map((node) => node[primaryKey]);

    const findChildrenOptions = {
      ...lodash.omit(options, ['limit', 'offset', 'filterByTk']),
      filter: {
        [primaryKey]: childIds,
      },
    };

    if (findChildrenOptions.fields) {
      [primaryKey, foreignKey].forEach((field) => {
        if (!findChildrenOptions.fields.includes(field)) {
          findChildrenOptions.fields.push(field);
        }
      });
    }

    const childInstances = await super.find(findChildrenOptions);

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
        return [];
      }

      return children.map((child) => {
        const childrenValues = buildTree(child.id);
        if (childrenValues.length > 0) {
          child.setDataValue(childrenKey, childrenValues);
        }
        return child;
      });
    }

    for (const parent of parentNodes) {
      const parentId = parent[primaryKey];
      const children = buildTree(parentId);
      if (children.length > 0) {
        parent.setDataValue(childrenKey, children);
      }
    }

    this.addIndex(parentNodes, childrenKey, options);

    return parentNodes;
  }

  private addIndex(treeArray, childrenKey, options) {
    function traverse(node, index) {
      // patch for sequelize toJSON
      if (node._options.includeNames && !node._options.includeNames.includes(childrenKey)) {
        node._options.includeNames.push(childrenKey);
      }

      if (options.addIndex !== false) {
        node.setDataValue('__index', `${index}`);
      }

      const children = node.getDataValue(childrenKey);

      if (children && children.length === 0) {
        node.setDataValue(childrenKey, undefined);
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

  async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]> {
    let totalCount = 0;
    let datas = [];
    if (Object.values(lodash.get(options, 'filter', {})).length === 0) {
      options = lodash.omit(options, ['filterByTk']);
      assign(options, {
        filter: {
          parentId: null,
        },
      });
      const [_, totalCountTmp] = await super.findAndCount(options);
      totalCount = totalCountTmp;
      datas = await this.find(options);
    } else {
      const limit = options.limit;
      const offset = options.offset;
      const optionsTmp = lodash.omit(options, ['limit', 'offset', 'filterByTk']);
      const collection = this.collection;
      const primaryKey = collection.model.primaryKeyAttribute;
      const childrenKey = collection.treeChildrenField?.name ?? 'children';
      const filterNodes = await super.find(optionsTmp);
      const filterIds = filterNodes.map((node) => node[primaryKey]);
      let rootIds: any[] = [];
      if (filterIds.length > 0) {
        rootIds = await this.queryRootIDs(filterIds, collection);
      }
      totalCount = rootIds.length;
      options = lodash.omit(optionsTmp, ['filter']);
      assign(options, {
        filter: {
          [primaryKey]: {
            $in: rootIds,
          },
        },
      });
      assign(options, {
        limit: limit,
        offset: offset,
      });
      datas = await this.find(options);

      const nodeIds = [];
      for (const id of filterIds) {
        if (!rootIds.includes(id)) {
          nodeIds.push(id);
        }
      }

      const treeNodes = this.flattenTree(datas, rootIds, filterIds, childrenKey);
      const nodeIdMap = {};
      for (const node of treeNodes) {
        delete node.dataValues[childrenKey];
        nodeIdMap[node.dataValues.id] = node;
      }

      const nodeDatas = await this.queryRootDatas(nodeIds);
      const nodeRootPkNodesMap = {};
      for (const nodeData of nodeDatas) {
        if (nodeRootPkNodesMap[nodeData.dataValues.rootPK]) {
          nodeRootPkNodesMap[nodeData.dataValues.rootPK] = [
            ...nodeRootPkNodesMap[nodeData.dataValues.rootPK],
            nodeIdMap[nodeData.dataValues.nodePk],
          ];
        } else {
          nodeRootPkNodesMap[nodeData.dataValues.rootPK] = [nodeIdMap[nodeData.dataValues.nodePk]];
        }
      }

      for (const node of datas) {
        if (nodeRootPkNodesMap[node.dataValues.id]) {
          for (let index = 0; index < nodeRootPkNodesMap[node.dataValues.id].length; index++) {
            if (
              nodeRootPkNodesMap[node.dataValues.id][index].dataValues &&
              nodeRootPkNodesMap[node.dataValues.id][index].dataValues.__index
            ) {
              const nodeTmp = lodash.cloneDeep(nodeRootPkNodesMap[node.dataValues.id][index]);
              nodeRootPkNodesMap[node.dataValues.id][index] = {
                ...nodeTmp.dataValues,
                __index: `${node.dataValues.__index}.${childrenKey}.${index}`,
              };
            }
            index = index++;
          }
          node.setDataValue(childrenKey, nodeRootPkNodesMap[node.dataValues.id]);
        }
      }
    }
    return [datas, totalCount];
  }

  private flattenTree(tree: any[], rootIds: any[], filterNodeIds: any[], childrenKey = 'children') {
    const result = [];
    for (let i = 0; i < tree.length; i++) {
      const node = {
        ...tree[i],
        isRootPk: rootIds.includes(tree[i].dataValues.id),
      };

      if (tree[i].dataValues[childrenKey] && tree[i].dataValues[childrenKey].length > 0) {
        const childNodes = this.flattenTree(tree[i].dataValues[childrenKey], rootIds, filterNodeIds, childrenKey);
        for (const nodeData of childNodes) {
          if (nodeData.isRootPk || filterNodeIds.includes(nodeData.dataValues.id)) {
            result.push(nodeData);
          }
        }
      }

      if (node.isRootPk || filterNodeIds.includes(node.dataValues.id)) {
        result.push(node);
      }
    }
    return result;
  }

  private async queryRootDatas(nodePks) {
    const collection = this.collection;
    const pathTableName = `main_${collection.name}_path`;
    const treeRepository = this.database.getRepository(pathTableName);
    if (treeRepository) {
      return await treeRepository.find({
        filter: {
          nodePk: {
            $in: nodePks,
          },
        },
      });
    }
    return [];
  }

  private async queryRootIDs(nodePks, collection) {
    const pathTableName = `main_${collection.name}_path`;
    const queryInterface = this.database.sequelize.getQueryInterface();
    const q = queryInterface.quoteIdentifier.bind(queryInterface);
    const datas = await this.database.sequelize.query(
      `
      SELECT DISTINCT(${q('rootPK')}) as ${q('rootId')}
      FROM ${pathTableName}
      WHERE ${q('nodePk')} IN (${nodePks.join(',')}) ;
      `,
      {
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    return datas.map((data: any) => {
      return data.rootId;
    });
  }

  private querySQL(rootIds, collection) {
    const { treeParentField } = collection;
    const foreignKey = treeParentField.options.foreignKey;
    const foreignKeyField = collection.model.rawAttributes[foreignKey].field;

    const primaryKey = collection.model.primaryKeyAttribute;

    const queryInterface = this.database.sequelize.getQueryInterface();
    const q = queryInterface.quoteIdentifier.bind(queryInterface);

    return `
      WITH RECURSIVE cte AS (SELECT ${q(primaryKey)}, ${q(foreignKeyField)}, 1 AS level
                             FROM ${collection.quotedTableName()}
                             WHERE ${q(foreignKeyField)} IN (${rootIds.join(',')})
                             UNION ALL
                             SELECT t.${q(primaryKey)}, t.${q(foreignKeyField)}, cte.level + 1 AS level
                             FROM ${collection.quotedTableName()} t
                                    JOIN cte ON t.${q(foreignKeyField)} = cte.${q(primaryKey)})
      SELECT ${q(primaryKey)}, ${q(foreignKeyField)} as ${q(foreignKey)}, level
      FROM cte
    `;
  }
}
