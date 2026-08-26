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
import { LRUCache } from 'lru-cache';

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

const systemKeys = [
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
    return [...(dm.getCollection(dataSourceKey, collectionName)?.fields.values() || [])]
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
      const safeFormData = Array.isArray(formData) ? formData : [];
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
          const targetFormField = safeFormData.find((v) => v?.name === option.key);
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
                exclude: ['id', ...systemKeys.filter((v) => v !== 'sort')],
                disabled: childrenDisabled,
              },
              safeFormData,
            );
          }
          return option;
        })
        .filter(Boolean);
      cache.set(collectionName + JSON.stringify(safeFormData), result);
      return result;
    };
  })(new LRUCache({ max: 50 }));

  const traverseAssociations = (collectionName, { prefix, maxDepth, depth = 0, exclude = [] }) => {
    if (depth > maxDepth || !dm.getCollection(dataSourceKey, collectionName)) {
      return [];
    }
    return [...(dm.getCollection(dataSourceKey, collectionName)?.fields.values() || [])]
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
          title: React.createElement(TreeNode, option),
          key: value,
          disabled: true,
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

  return {
    async run(model) {
      if (!model?.mapSubModels) {
        callBack?.([], []);
        return;
      }

      const formData = new Set<any>();
      const selectFields = new Set<string>();

      const getAssociationAppends = (currentModel, subKey) => {
        currentModel?.mapSubModels?.(subKey, (item) => {
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
                getAssociationAppends(item.subModels.field.subModels.grid, 'items');
              } else if (item.subModels.field.subModels.subTableColumns) {
                getAssociationAppends(item.subModels.field, 'subTableColumns');
              } else if (item.subModels.field.subModels.columns) {
                getAssociationAppends(item.subModels.field, 'columns');
              }
            }
          }
        });
      };

      getAssociationAppends(model, 'items');
      const fieldTree = traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 1 }, [...formData]);
      callBack?.(fieldTree, [...selectFields]);
    },
  };
};
