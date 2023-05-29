import { ArrayField } from '@formily/core';
import { error } from '@nocobase/utils/client';
import _ from 'lodash';
import React, { useCallback, useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';
import { TreeNode } from '../TreeLabel';

export const useCollectionState = (currentCollectionName: string) => {
  const { getCollectionFields, getAllCollectionsInheritChain, getCollection, getCollectionFieldsOptions } =
    useCollectionManager();
  const [collectionList] = useState(getCollectionList);
  const compile = useCompile();

  let dataFields: ArrayField = {} as any;

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

  /**
   * fields: 通过在 x-reactions 字段中传递 $self 得到的，相当于 useField 的返回值，目的是修改其中的状态页面会更新
   */
  const getEnableFieldTree = useCallback((collectionName: string, fields: ArrayField) => {
    dataFields = fields;

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

  const onLoadData = useCallback((node) => {
    return new Promise((resolve) => {
      if (node.children.length) {
        node.children.forEach((child) => {
          loadChildren({ node: child, traverseAssociations, traverseFields, systemKeys, dataFields });
        });
        return resolve(void 0);
      }

      loadChildren({ node, traverseAssociations, traverseFields, systemKeys, dataFields });
      resolve(void 0);
    });
  }, []);

  const onCheck = useCallback((checkedKeys, { node, checked }) => {
    if (checked) {
      let parentKey = node.key.split('.').slice(0, -1).join('.');

      try {
        // 当子节点被选中时，也选中所有祖先节点，提高用户辨识度
        while (parentKey) {
          if (parentKey) {
            checkedKeys.checked = _.uniq([...checkedKeys.checked, parentKey]);
          }

          parentKey = parentKey.split('.').slice(0, -1).join('.');
        }
      } catch (err) {
        error(err);
      }
    }

    dataFields.value = checkedKeys;
  }, []);

  return {
    collectionList,
    getEnableFieldTree,
    onLoadData,
    onCheck,
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

function loadChildren({ node, traverseAssociations, traverseFields, systemKeys, dataFields }) {
  const activeNode = findNode(dataFields.componentProps.treeData, node);
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
