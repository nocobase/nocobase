/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { CountOptions, FindOptions, Repository, FindAndCountOptions, Transactionable, Model } from '@nocobase/database';
import { isValidFilter } from '@nocobase/utils';

export class AdjacencyListRepository extends Repository {
  async update(options): Promise<any> {
    return super.update({
      ...(options || {}),
      addIndex: false,
    });
  }

  buildRootNodeDataMap(nodeData: Model[]) {
    const rootPathDataMap: {
      [key: string]: string[];
    } = {};
    for (const node of nodeData) {
      if (rootPathDataMap[node.get('rootPk')]) {
        rootPathDataMap[node.get('rootPk')] = [...rootPathDataMap[node.get('rootPk')], node.get('path')];
      } else {
        rootPathDataMap[node.get('rootPk')] = [node.get('path')];
      }
    }

    const rebuildTreeRootNodeDataMap: {
      [key: string]: Set<any>;
    } = {};
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
    return rebuildTreeRootNodeDataMap;
  }

  async buildTree(paths: Model[], options: FindOptions & { addIndex?: boolean } = {}, rootNodes?: Model[]) {
    const collection = this.collection;
    const primaryKey = collection.model.primaryKeyAttribute;
    // @ts-ignore
    const foreignKey = collection.treeForeignKey;
    const childrenKey = collection.treeChildrenField?.name ?? 'children';
    const treePathMap = this.buildRootNodeDataMap(paths);
    if (!rootNodes) {
      const rootIds = Object.keys(treePathMap);
      if (!rootIds.length) {
        this.database.logger.warn('adjacency-list-repository: rootIds is empty');
        return [];
      }
      rootNodes = await super.find({
        filter: {
          [primaryKey]: {
            $in: rootIds,
          },
        },
        ...lodash.omit(options, ['filter', 'filterByTk']),
        transaction: options.transaction,
      });
    }
    const childIds: any[] = [];
    for (const nodeIdSet of Object.values(treePathMap)) {
      for (const nodeId of nodeIdSet) {
        childIds.push(nodeId);
      }
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

    function buildTree(rootId: string | number) {
      const children = nodeMap[rootId];

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

    for (const root of rootNodes) {
      const rootId = root[primaryKey];
      const children = buildTree(rootId);
      if (children.length > 0) {
        root.setDataValue(childrenKey, children);
      }
    }

    this.addIndex(rootNodes, childrenKey, options);

    return rootNodes;
  }

  async findWithoutFilter(options: FindOptions & { addIndex?: boolean } = {}): Promise<any> {
    // @ts-ignore
    const foreignKey = this.collection.treeForeignKey;
    const rootNodes = await super.find({ ...options, filter: { [foreignKey]: null } });
    if (!rootNodes.length) {
      return [];
    }
    const collection = this.collection;
    const primaryKey = collection.model.primaryKeyAttribute;
    const rootPks = rootNodes.map((node) => node[primaryKey]);
    const paths = await this.queryPathByRoot({
      rootPks,
      dataSourceName: options.context?.dataSource?.name ?? 'main',
      transaction: options.transaction,
    });
    return await this.buildTree(paths, options, rootNodes);
  }

  async countWithoutFilter(options: CountOptions & { raw?: boolean; tree?: boolean }): Promise<number> {
    // @ts-ignore
    const foreignKey = this.collection.treeForeignKey;
    return await super.count({ ...options, filter: { [foreignKey]: null } });
  }

  async filterAndGetPaths(options: FindOptions & { addIndex?: boolean } = {}): Promise<{
    filterNodes: Model[];
    paths: Model[];
  }> {
    const primaryKey = this.collection.model.primaryKeyAttribute;
    const filterNodes = await super.find({
      fields: [primaryKey],
      ...lodash.omit(options, ['limit', 'offset', 'fields']),
    });
    if (!filterNodes.length) {
      return { filterNodes: [], paths: [] };
    }

    const filterPks = filterNodes.map((node: Model) => node[primaryKey]);
    if (!filterPks.length) {
      this.database.logger.debug('adjacency-list-repository: filterIds is empty');
      return { filterNodes, paths: [] };
    }
    const paths = await this.queryPathByNode({
      nodePks: filterPks,
      dataSourceName: options.context?.dataSource?.name ?? 'main',
      transaction: options.transaction,
    });
    return { filterNodes, paths };
  }

  async find(options: FindOptions & { addIndex?: boolean } = {}): Promise<any> {
    if (options.raw || !options.tree) {
      return await super.find(options);
    }

    const primaryKey = this.collection.model.primaryKeyAttribute;
    if (options.fields && !options.fields.includes(primaryKey)) {
      options.fields.push(primaryKey);
    }

    if (!isValidFilter(options.filter) && !options.filterByTk) {
      return await this.findWithoutFilter(options);
    }

    const { filterNodes, paths } = await this.filterAndGetPaths(options);
    if (!paths.length) {
      return filterNodes;
    }
    return await this.buildTree(paths, options);
  }

  countByPaths(paths: Model[]): number {
    const rootIds = new Set();
    for (const path of paths) {
      rootIds.add(path.get('rootPk'));
    }
    return rootIds.size;
  }

  async count(countOptions?: CountOptions & { raw?: boolean; tree?: boolean }): Promise<number> {
    if (countOptions.raw || !countOptions.tree) {
      return await super.count(countOptions);
    }
    if (!isValidFilter(countOptions.filter) && !countOptions.filterByTk) {
      return await this.countWithoutFilter(countOptions);
    }
    const { paths } = await this.filterAndGetPaths(countOptions);
    return this.countByPaths(paths);
  }

  async findAndCount(options?: FindAndCountOptions & { filterByTk?: number | string }): Promise<[Model[], number]> {
    options = {
      ...options,
      transaction: await this.getTransaction(options.transaction),
    };

    if (options.raw || !options.tree) {
      return await super.findAndCount(options);
    }
    if (!isValidFilter(options.filter) && !options.filterByTk) {
      const count = await this.countWithoutFilter(options);
      const results = count ? await this.findWithoutFilter(options) : [];
      return [results, count];
    }
    const { filterNodes, paths } = await this.filterAndGetPaths(options);
    if (!paths.length) {
      return [filterNodes, 0];
    }
    const results = await this.buildTree(paths, options);
    const count = this.countByPaths(paths);
    return [results, count];
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

  private async queryPathByNode({
    nodePks,
    dataSourceName,
    transaction,
  }: { nodePks: (string | number)[]; dataSourceName: string } & Transactionable): Promise<Model[]> {
    const collection = this.collection;
    const pathTableName = `${dataSourceName}_${collection.name}_path`;
    const repo = this.database.getRepository(pathTableName);
    if (repo) {
      return await repo.find({
        filter: {
          nodePk: {
            $in: nodePks,
          },
        },
        transaction,
      });
    }
    this.database.logger.warn(`Collection tree path table: ${pathTableName} not found`);
    return [];
  }

  private async queryPathByRoot({
    rootPks,
    dataSourceName,
    transaction,
  }: { rootPks: (string | number)[]; dataSourceName: string } & Transactionable): Promise<Model[]> {
    const collection = this.collection;
    const pathTableName = `${dataSourceName}_${collection.name}_path`;
    const repo = this.database.getRepository(pathTableName);
    if (repo) {
      return await repo.find({
        filter: {
          rootPk: {
            $in: rootPks,
          },
        },
        transaction,
      });
    }
    this.database.logger.warn(`Collection tree path table: ${pathTableName} not found`);
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
}
