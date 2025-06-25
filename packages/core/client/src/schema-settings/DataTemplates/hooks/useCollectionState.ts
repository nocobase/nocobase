/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import React, { useCallback, useState } from 'react';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';
import { TreeNode } from '../TreeLabel';

// 过滤掉系统字段
export const systemKeys = [
  // 'id',
  'sort',
  'createdById',
  'createdBy',
  'createdAt',
  'updatedById',
  'updatedBy',
  'updatedAt',
  'password',
  'sequence',
];
/**
 *
 * @param currentCollectionName 数据表name
 * @param displayType boolean 是否显示字段标识
 * @returns
 */
export const useCollectionState = (currentCollectionName: string, displayType = true, filterFields?) => {
  const { getCollectionFields, getAllCollectionsInheritChain, getCollection, getInterface } =
    useCollectionManager_deprecated();
  const [collectionList] = useState(getCollectionList);
  const compile = useCompile();
  const templateField: any = useField();

  function getCollectionList() {
    const collections = getAllCollectionsInheritChain(currentCollectionName) || [];
    return collections.map((name) => ({ label: getCollection(name)?.title, value: name }));
  }

  /**
   * maxDepth: 从 0 开始，0 表示一层，1 表示两层，以此类推
   */
  const traverseFields = (collectionName, { exclude = [], depth = 0, maxDepth, prefix = '' }) => {
    if (depth > maxDepth) {
      return [];
    }

    return getCollectionFields(collectionName)
      .map((field) => {
        if (exclude.includes(field.name)) {
          return;
        }
        if (!field.interface) {
          return;
        }
        if (['password', 'sequence'].includes(field.type)) {
          return;
        }
        if (filterFields && filterFields(field)) {
          return;
        }
        const node = {
          type: 'duplicate',
          tag: compile(field.uiSchema?.title) || field.name,
        };
        const option = {
          ...node,
          role: 'button',
          title: React.createElement(TreeNode, { ...node, displayType }),
          key: prefix ? `${prefix}.${field.name}` : field.name,
          isLeaf: true,
          field,
        };
        // 多对多和多对一只展示关系字段
        if (['belongsTo', 'belongsToMany'].includes(field.type)) {
          node['type'] = 'reference';
          option['type'] = 'reference';
          option['title'] = React.createElement(TreeNode, { ...node, type: 'reference', displayType });
          option.isLeaf = false;
          option['children'] = traverseAssociations(field.target, {
            depth: depth + 1,
            maxDepth,
            prefix: option.key,
            exclude: systemKeys,
          });
        } else if (['hasOne', 'hasMany'].includes(field.type)) {
          option.isLeaf = false;
          option['children'] = traverseFields(field.target, {
            depth: depth + 1,
            maxDepth,
            prefix: option.key,
            exclude: ['id', ...systemKeys],
          });
        }
        return option;
      })
      .filter(Boolean);
  };

  const traverseAssociations = (collectionName, { prefix, maxDepth, depth = 0, exclude = [] }) => {
    if (depth > maxDepth) {
      return [];
    }
    return getCollectionFields(collectionName)
      .map((field) => {
        if (!field.target || !field.interface) {
          return;
        }
        if (exclude.includes(field.name)) {
          return;
        }
        const option = {
          type: 'preloading',
          tag: compile(field.uiSchema?.title) || field.name,
        };
        const value = prefix ? `${prefix}.${field.name}` : field.name;
        return {
          role: 'button',
          title: React.createElement(TreeNode, { ...option, displayType }),
          key: value,
          isLeaf: false,
          field,
          children: traverseAssociations(field.target, {
            prefix: value,
            depth: depth + 1,
            maxDepth,
            exclude,
          }),
        };
      })
      .filter(Boolean);
  };
  const parseTreeData = (data) => {
    return data.map((v) => {
      return {
        ...v,
        role: 'button',
        title: React.createElement(TreeNode, { ...v, type: v.type, displayType }),
        children: v.children ? parseTreeData(v.children) : null,
      };
    });
  };

  const getEnableFieldTree = useCallback((collectionName: string, field, treeData?) => {
    const index = field.index;
    const targetTemplate = templateField.initialValue?.items?.[index];
    if (!collectionName) {
      return [];
    }
    if (targetTemplate?.treeData || treeData) {
      return parseTreeData(treeData || targetTemplate.treeData);
    }
    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 1 });
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const getOnLoadData = useCallback((fields: ArrayField) => {
    return (node) => {
      return new Promise((resolve) => {
        if (node.children.length) {
          node.children.forEach((child) => {
            loadChildren({ node: child, traverseAssociations, traverseFields, systemKeys, fields });
          });
          return resolve(void 0);
        }

        loadChildren({ node, traverseAssociations, traverseFields, systemKeys, fields });
        resolve(void 0);
      });
    };
  }, []);

  const getOnCheck = useCallback((fields: ArrayField) => {
    return (checkedKeys) => {
      fields.value = checkedKeys;
    };
  }, []);

  const getScopeDataSource = (resource: string) => {
    const fields = getCollectionFields(resource);
    const field2option = (field, depth) => {
      if (!field.interface) {
        return;
      }
      const fieldInterface = getInterface(field.interface);
      if (!fieldInterface?.filterable) {
        return;
      }
      const { nested, children, operators } = fieldInterface.filterable;
      const option = {
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        schema: field?.uiSchema,
        operators:
          operators?.filter?.((operator) => {
            return !operator?.visible || operator.visible(field);
          }) || [],
        interface: field.interface,
      };
      if (field.target && depth > 2) {
        return;
      }
      if (depth > 2) {
        return option;
      }
      if (children?.length) {
        option['children'] = children;
      }
      if (nested) {
        const targetFields = getCollectionFields(field.target);
        const options = getOptions(targetFields, depth + 1).filter(Boolean);
        option['children'] = option['children'] || [];
        option['children'].push(...options);
      }
      return option;
    };
    const getOptions = (fields, depth) => {
      const options = [];
      fields.forEach((field) => {
        const option = field2option(field, depth);
        if (option) {
          options.push(option);
        }
      });
      return options;
    };
    const options = getOptions(fields, 1);
    return options;
  };
  const useTitleFieldDataSource = (field) => {
    const fieldPath = field.path.entire.replace('titleField', 'collection');
    const collectionName = field.query(fieldPath).get('value');
    const targetFields = getCollectionFields(collectionName);
    const options = targetFields
      .filter((field) => {
        return getInterface(field.interface)?.titleUsable;
      })
      .map((field) => ({
        value: field?.name,
        label: compile(field?.uiSchema?.title) || field?.name,
      }));
    field.dataSource = options;
  };
  return {
    collectionList,
    getEnableFieldTree,
    getOnLoadData,
    getOnCheck,
    getScopeDataSource,
    useTitleFieldDataSource,
  };
};

// 广度优先遍历查找一个 key 相等的节点并返回
// 注意：返回的 node 是一个响应式对象，修改它的属性会触发页面更新
function findNode(treeData, item) {
  const queue = [...treeData];
  while (queue.length) {
    const node = queue.shift();
    if (node.key === item.key) {
      return node;
    }
    if (node.children) {
      queue.push(...node.children);
    }
  }
}

function loadChildren({ node, traverseAssociations, traverseFields, systemKeys, fields }) {
  const activeNode = findNode(fields.dataSource || fields.componentProps.treeData, node);
  let children = [];
  // 多对多和多对一只展示关系字段
  if (['belongsTo', 'belongsToMany'].includes(node.field.type) && node?.type === 'reference') {
    children = traverseAssociations(node.field.target, {
      exclude: systemKeys,
      prefix: node.key,
      maxDepth: 1,
    });
  } else if (['hasOne', 'hasMany'].includes(node.field.type) || node?.type === 'duplicate') {
    children = traverseFields(node.field.target, {
      exclude: ['id', ...systemKeys],
      prefix: node.key,
      maxDepth: 1,
    });
  }

  if (children.length) {
    activeNode.children = children;
  } else {
    activeNode.isLeaf = true;
  }

  return children;
}
