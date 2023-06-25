import { ArrayField } from '@formily/core';
import React, { useCallback, useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';
import { TreeNode } from '../TreeLabel';

export const useCollectionState = (currentCollectionName: string) => {
  const { getCollectionFields, getAllCollectionsInheritChain, getCollection } = useCollectionManager();
  const [collectionList] = useState(getCollectionList);
  const compile = useCompile();

  function getCollectionList() {
    const collections = getAllCollectionsInheritChain(currentCollectionName);
    return collections.map((name) => ({ label: getCollection(name)?.title, value: name }));
  }

  // 过滤掉系统字段
  const systemKeys = [
    // 'id',
    'sort',
    'createdById',
    'createdBy',
    'createdAt',
    'updatedById',
    'updatedBy',
    'updatedAt',
  ];

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
        if (['sort', 'password', 'sequence'].includes(field.type)) {
          return;
        }
        const node = {
          type: 'duplicate',
          tag: compile(field.uiSchema?.title) || field.name,
        };
        const option = {
          ...node,
          title: React.createElement(TreeNode, node),
          key: prefix ? `${prefix}.${field.name}` : field.name,
          isLeaf: true,
          field,
        };
        // 多对多和多对一只展示关系字段
        if (['belongsTo', 'belongsToMany'].includes(field.type)) {
          node['type'] = 'reference';
          option['type'] = 'reference';
          option['title'] = React.createElement(TreeNode, { ...node, type: 'reference' });
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
          title: React.createElement(TreeNode, option),
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

  const getEnableFieldTree = useCallback((collectionName: string) => {
    if (!collectionName) {
      return [];
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

  return {
    collectionList,
    getEnableFieldTree,
    getOnLoadData,
    getOnCheck,
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
  const activeNode = findNode(fields.componentProps.treeData, node);
  let children = [];

  // 多对多和多对一只展示关系字段
  if (['belongsTo', 'belongsToMany'].includes(node.field.type)) {
    children = traverseAssociations(node.field.target, {
      exclude: systemKeys,
      prefix: node.key,
      maxDepth: 1,
    });
  } else if (['hasOne', 'hasMany'].includes(node.field.type)) {
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
