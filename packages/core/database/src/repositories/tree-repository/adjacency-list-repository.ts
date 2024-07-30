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
import { FindAndCountOptions } from 'sequelize';
import { assign } from '@nocobase/utils';

interface rootPathDataMapInterface {
  [key: string]: string[];
}

interface rebuildTreeRootNodeDataInterface {
  [key: string]: Set<any>;
}

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

  async find(options: FindOptions & { addIndex?: boolean; filter?: any } = {}): Promise<any> {
    let childIds: any[] = [];
    childIds = lodash.get(options, ['filter', 'childIds'], []);
    options = lodash.omit(options, 'filter.childIds');

    //for sqlite weired bug
    if (options.filter && Object.keys(options.filter).length === 1 && options.filter.id === undefined) {
      delete options.filter.id;
      options.filter = {
        ...options.filter,
      };
    }
    if (options.raw || !options.tree) {
      return await super.find(options);
    }

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

    if (childIds.length === 0) {
      childIds = childNodes.map((node) => node[primaryKey]);
    }

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

  async findAndCount(
    options?: FindAndCountOptions & { tree?: boolean; fields?: string[]; filter?: any },
  ): Promise<[Model[], number]> {
    let totalCount = 0;
    let datas = [];
    const foreignKey = this.collection.treeParentField?.foreignKey || 'parentId';
    if (options.raw || !options.tree) {
      return await super.findAndCount(options);
    }
    if (
      JSON.stringify(lodash.get(options, ['filter', '$and'], {})) === JSON.stringify([{}, { [foreignKey]: null }]) ||
      JSON.stringify(lodash.get(options, ['filter'], {})) === JSON.stringify({ [foreignKey]: null })
    ) {
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
      const fields = lodash.cloneDeep(options.fields);
      const optionsClone = lodash.clone(options);
      const optionsTmp = lodash.omit(optionsClone, ['limit', 'offset']);
      const collection = this.collection;
      const primaryKey = collection.model?.primaryKeyAttribute ?? 'id';
      if (options.fields !== undefined && options.fields.length > 0 && !options.fields.includes(primaryKey)) {
        optionsTmp.fields.push(primaryKey);
      }
      const filterNodes = await super.find(optionsTmp);
      const filterIds = filterNodes.map((node) => node[primaryKey]);
      const nodeData = await this.queryRootDatas(filterIds, options.context.dataSource.name);

      const rootPathDataMap: rootPathDataMapInterface = {};

      for (const node of nodeData) {
        if (rootPathDataMap[node.dataValues.rootPk]) {
          rootPathDataMap[node.dataValues.rootPk] = [...rootPathDataMap[node.dataValues.rootPk], node.dataValues.path];
        } else {
          rootPathDataMap[node.dataValues.rootPk] = [node.dataValues.path];
        }
      }

      const rebuildTreeRootNodeDataMap: rebuildTreeRootNodeDataInterface = {};
      //find commons root path
      for (const pathArray of Object.values(rootPathDataMap)) {
        const commonParentPath = this.findCommonParent(pathArray);
        const commonParentPathNodeArray: string[] = commonParentPath.split('/').filter((item) => {
          return item !== '';
        });
        if (pathArray.length == 1) {
          rebuildTreeRootNodeDataMap[commonParentPathNodeArray[0]] = new Set();
          for (const i of commonParentPathNodeArray) {
            rebuildTreeRootNodeDataMap[commonParentPathNodeArray[0]].add(i);
          }
          continue;
        }
        // get filter root nodeid
        const commonParentRootNodeId = commonParentPathNodeArray[commonParentPathNodeArray.length - 1];
        rebuildTreeRootNodeDataMap[commonParentRootNodeId] = new Set([
          commonParentPathNodeArray[commonParentPathNodeArray.length - 1],
        ]);
        for (const path of pathArray) {
          if (commonParentPath != path) {
            const commonPathNodeArray = path.split(commonParentPath).filter((item) => {
              return item !== '';
            });
            for (const i of commonPathNodeArray[0].split('/').filter((item) => {
              return item !== '';
            })) {
              rebuildTreeRootNodeDataMap[commonParentRootNodeId].add(i);
            }
          }
        }
      }

      const childIds = [];
      for (const nodeIdSet of Object.values(rebuildTreeRootNodeDataMap)) {
        for (const nodeId of nodeIdSet) {
          childIds.push(nodeId);
        }
      }

      let rootIds: any[] = [];
      rootIds = Object.keys(rebuildTreeRootNodeDataMap);
      if (rootIds.length === 0) {
        return [[], 0];
      }

      totalCount = rootIds.length;
      options = lodash.omit(optionsClone, ['filter', primaryKey]);
      assign(options, {
        filter: {
          [primaryKey]: {
            $in: rootIds,
          },
          childIds: childIds,
          ...options?.filter,
        },
      });
      assign(options, {
        limit: limit,
        offset: offset,
        fields: fields,
      });
      datas = await this.find(options);
    }
    return [datas, totalCount];
  }

  private async queryRootDatas(nodePks, dataSourceName): Promise<any> {
    const collection = this.collection;
    const pathTableName = `${dataSourceName}_${collection.name}_path`;
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
    this.collection.context.database.logger.warn(`Collection tree path table: ${pathTableName} not found`);
    return [];
  }

  private findCommonParent(strings: string[]): string | undefined {
    if (strings.length === 0) {
      return undefined;
    }

    let prefix = strings[0];

    for (let i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        if (prefix.length === 0) {
          return '';
        }
        prefix = prefix.slice(0, -1);
      }
    }
    return prefix;
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
