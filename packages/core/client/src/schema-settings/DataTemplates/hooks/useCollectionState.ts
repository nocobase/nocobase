import { ArrayField } from '@formily/core';
import { observable } from '@formily/reactive';
import React, { useCallback, useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';
import { TreeNode } from '../TreeLabel';

export const useCollectionState = (currentCollectionName: string) => {
  const { getCollectionFields, getAllCollectionsInheritChain, getCollection, getCollectionFieldsOptions } =
    useCollectionManager();
  const [collectionList] = useState(getCollectionList);
  const compile = useCompile();

  let dataFields: ArrayField = [] as any;

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
        // 多对多的只展示关系字段
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
        return observable(option);
      })
      .filter(Boolean);
  };

  const traverseAssociations = (collectionName, { prefix, maxDepth, depth, exclude = [] }) => {
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

  /**
   * fields: 通过在 x-reactions 字段中传递 $self 得到的，相当于 useField 的返回值，目的是修改其中的状态页面会更新
   */
  const getEnableFieldTree = useCallback((collectionName: string, fields: ArrayField) => {
    dataFields = fields;

    if (!collectionName) {
      return [];
    }

    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 0 });
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const onLoadData = useCallback((node) => {
    return new Promise((resolve) => {
      const result = findNode(dataFields.componentProps.treeData, node);

      result.children = traverseFields(node.field.target, {
        exclude: ['id', ...systemKeys],
        prefix: node.key,
        maxDepth: 0,
      });

      resolve(void 0);
    });
  }, []);

  return {
    collectionList,
    getEnableFieldTree,
    onLoadData,
  };
};

// 广度优先遍历查找一个 key 相等的节点并返回
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
