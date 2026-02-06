/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { ArrayBase } from '@formily/antd-v5';
import LRUCache from 'lru-cache';

const TreeNode = (props) => {
  const { tag, type, displayType = true } = props;
  const text = {
    reference: 'Reference',
    duplicate: 'Duplicate',
    preloading: 'Preloading',
  };
  const colors = {
    reference: 'blue',
    duplicate: 'green',
    preloading: 'cyan',
  };
  return (
    <div>
      <Tag color={colors[type]}>
        <span>{tag}</span> {displayType ? `(${text[type]})` : ''}
      </Tag>
    </div>
  );
};

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
  'password',
  'sequence',
];

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

function loadChildren({ node, traverseAssociations, traverseFields, systemKeys, dataSource, setDataSource }) {
  const activeNode = findNode(dataSource, node);
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
      exclude: ['id', ...systemKeys.filter((v) => v !== 'sort')],
      prefix: node.key,
      maxDepth: 1,
    });
  }

  if (children.length) {
    activeNode.children = children;
  } else {
    activeNode.isLeaf = true;
  }
  setDataSource([...dataSource]);
  return children;
}

export const getCollectionState = (dm, t, dataSourceKey, displayType = true) => {
  /**
   * maxDepth: 从 0 开始，0 表示一层，1 表示两层，以此类推
   */
  const traverseFields = (collectionName, { exclude = [], depth = 0, maxDepth, prefix = '' }) => {
    if (depth > maxDepth) {
      return [];
    }
    return [...dm.getCollection(dataSourceKey, collectionName).fields.values()]
      .map((field) => {
        if (exclude.includes(field.name)) {
          return;
        }
        if (!field.interface) {
          return;
        }
        if (depth === 0 && ['sort', 'password', 'sequence'].includes(field.type)) {
          return;
        }
        const node = {
          type: 'duplicate',
          tag: t(field.uiSchema?.title) || field.name,
        };
        const option = {
          ...node,
          role: 'button',
          title: React.createElement(TreeNode, { ...node, displayType: true }),
          key: prefix ? `${prefix}.${field.name}` : field.name,
          isLeaf: true,
          field,
        };
        // 多对多和多对一只展示关系字段
        if (['belongsTo', 'belongsToMany'].includes(field.type)) {
          node['type'] = 'reference';
          option['type'] = 'reference';
          option['title'] = React.createElement(TreeNode, { ...node, type: 'reference', displayType: true });
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
            exclude: ['id', ...systemKeys.filter((v) => v !== 'sort')],
          });
        }
        return option;
      })
      .filter(Boolean);
  };

  const traverseAssociations = (collectionName, { prefix, maxDepth, depth = 0, exclude = [] }) => {
    if (depth > maxDepth || !dm.getCollection(dataSourceKey, collectionName)) {
      return [];
    }
    // eslint-disable-next-line no-unsafe-optional-chaining
    return [...dm.getCollection(dataSourceKey, collectionName)?.fields.values()]
      .map((field) => {
        if (!field.target || !field.interface) {
          return;
        }
        if (exclude.includes(field.name)) {
          return;
        }
        const option = {
          type: 'preloading',
          tag: t(field.uiSchema?.title) || field.name,
        };
        const value = prefix ? `${prefix}.${field.name}` : field.name;
        return {
          role: 'button',
          title: React.createElement(TreeNode, { ...option, displayType: true }),
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

  const getEnableFieldTree = (collectionName: string) => {
    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 1 });
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  const getOnLoadData = (dataSource: any, setDataSource) => {
    return (node) => {
      return new Promise((resolve) => {
        if (node.children.length) {
          node.children.forEach((child) => {
            loadChildren({ node: child, traverseAssociations, traverseFields, systemKeys, dataSource, setDataSource });
          });
          return resolve(void 0);
        }

        loadChildren({ node, traverseAssociations, traverseFields, systemKeys, dataSource, setDataSource });
        resolve(void 0);
      });
    };
  };

  const getOnCheck = (fields: any) => {
    return (checkedKeys) => {
      fields.value = checkedKeys;
    };
  };
  return {
    getEnableFieldTree,
    getOnLoadData,
    getOnCheck,
  };
};

export const getSyncFromForm = (dm, t, dataSourceKey, collectionName, callBack) => {
  const traverseFields = ((cache) => {
    return (collectionName, { exclude = [], depth = 0, maxDepth, prefix = '', disabled = false }, formData) => {
      if (depth > maxDepth) {
        return [];
      }
      const result = (
        dm.getCollection(dataSourceKey, collectionName)
          ? [...dm.getCollection(dataSourceKey, collectionName).fields.values()]
          : []
      )
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
            tag: t(field.uiSchema?.title) || field.name,
          };
          const option = {
            ...node,
            title: React.createElement(TreeNode, node),
            key: prefix ? `${prefix}.${field.name}` : field.name,
            isLeaf: true,
            field,
            disabled,
          };
          const targetFormField = formData.find((v) => v.name === option.key);
          if (
            ['belongsTo', 'belongsToMany'].includes(field.type) &&
            (!targetFormField || !targetFormField?.updateAssociation)
          ) {
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
          } else if (['hasOne', 'hasMany'].includes(field.type) || targetFormField?.updateAssociation) {
            let childrenDisabled = false;
            if (['hasOne', 'hasMany'].includes(field.type) && !targetFormField?.updateAssociation) {
              childrenDisabled = true;
            }
            option.disabled = true;
            option.isLeaf = false;
            option['children'] = traverseFields(
              field.target,
              {
                depth: depth + 1,
                maxDepth,
                prefix: option.key,
                exclude: ['id', ...systemKeys],
                disabled: childrenDisabled,
              },
              formData,
            );
          }
          return option;
        })
        .filter(Boolean);

      return result;
    };
  })(new LRUCache<string, any>({ max: 100 }));

  const traverseAssociations = ((cache) => {
    return (collectionName, { prefix, maxDepth, depth = 0, exclude = [] }) => {
      const cacheKey = `${collectionName}-${exclude.join(',')}-${depth}-${maxDepth}-${prefix}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      if (depth > maxDepth) {
        return [];
      }

      const result = (
        dm.getCollection(dataSourceKey, collectionName)
          ? [...dm.getCollection(dataSourceKey, collectionName).fields.values()]
          : []
      )
        .map((field) => {
          if (!field.target || !field.interface) {
            return;
          }
          if (exclude.includes(field.name)) {
            return;
          }

          const option = {
            type: 'preloading',
            tag: t(field.uiSchema?.title) || field.name,
          };
          const value = prefix ? `${prefix}.${field.name}` : field.name;
          return {
            type: 'preloading',
            tag: t(field.uiSchema?.title) || field.name,
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
      cache.set(cacheKey, result);
      return result;
    };
  })(new LRUCache<string, any>({ max: 100 }));
  const getEnableFieldTree = (collectionName: string, formData) => {
    if (!collectionName) {
      return [];
    }

    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 1, disabled: false }, formData);
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  return {
    async run(model) {
      const formData = new Set([]);
      const selectFields = new Set([]);

      const getAssociationAppends = (model, subKey) => {
        model.mapSubModels(subKey, (item) => {
          if (
            item.collectionField &&
            !(['hasOne', 'hasMany'].includes(item.collectionField.type) || item.subModels.field?.updateAssociation)
          ) {
            selectFields.add(item.fieldPath);
          }

          if (item.collectionField && item.collectionField.isAssociationField()) {
            formData.add({
              name: item.fieldPath,
              updateAssociation: item.subModels.field?.updateAssociation,
            });
            if (item.subModels.field?.updateAssociation) {
              if (item.subModels.field.subModels.grid) {
                //子表单
                getAssociationAppends(item.subModels.field.subModels.grid, 'items');
              } else if (item.subModels.field.subModels.subTableColumns) {
                //子表格（弹窗编辑）subTableColumns
                getAssociationAppends(item.subModels.field, 'subTableColumns');
              } else if (item.subModels.field.subModels.columns) {
                //子表格（行内编辑）subTableColumns
                getAssociationAppends(item.subModels.field, 'columns');
              }
            }
          }
        });
      };
      getAssociationAppends(model, 'items');
      const treeData = getEnableFieldTree(collectionName, [...formData]);
      if (callBack) {
        callBack(treeData, [...selectFields]);
      }
    },
  };
};
