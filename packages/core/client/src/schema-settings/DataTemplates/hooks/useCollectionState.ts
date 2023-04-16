import React, { useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';
import { useCompile } from '../../../schema-component';
import { TreeNode } from '../TreeLabel';

export const useCollectionState = (currentCollectionName: string) => {
  const { getCollectionFields, getAllCollectionsInheritChain, getCollection, getCollectionFieldsOptions } =
    useCollectionManager();
  const [collectionList] = useState(getCollectionList);
  const compile = useCompile();

  function getCollectionList() {
    const collections = getAllCollectionsInheritChain(currentCollectionName);
    return collections.map((name) => ({ label: getCollection(name).title, value: name }));
  }

  const getEnableFieldTree = (collectionName: string) => {
    if (!collectionName) {
      return [];
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
            children: traverseAssociations(getCollectionFields(field.target), {
              prefix: value,
              depth: depth + 1,
              maxDepth,
              exclude,
            }),
          };
        })
        .filter(Boolean);
    };
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
          const node = {
            type: 'duplicate',
            tag: compile(field.uiSchema?.title) || field.name,
          };
          const option = {
            title: React.createElement(TreeNode, node),
            key: prefix ? `${prefix}.${field.name}` : field.name,
          };
          // 多对多的只展示关系字段
          if (['belongsTo', 'belongsToMany'].includes(field.type)) {
            option['type'] = 'reference';
            option['label'] = React.createElement(TreeNode, { ...node, type: 'reference' });
            option['children'] = traverseAssociations(field.target, {
              depth: depth + 1,
              maxDepth,
              prefix: option.key,
              exclude: systemKeys,
            });
          } else if (['hasOne', 'hasMany'].includes(field.type)) {
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
    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 3 });
    } catch (error) {
      console.error(error);
      return [];
    }
  };

  return {
    collectionList,
    getEnableFieldTree,
  };
};
