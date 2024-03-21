import { ArrayBase } from '@formily/antd-v5';
import { useForm } from '@formily/react';
import { message } from 'antd';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAssociationPath } from '../../block-provider/hooks';
import { useCollectionManager_deprecated } from '../../collection-manager';
import { useCompile } from '../../schema-component';
import { TreeNode } from './TreeLabel';
import { systemKeys } from './hooks/useCollectionState';
import LRUCache from 'lru-cache';

export const useSyncFromForm = (fieldSchema, collection?, callBack?) => {
  const { getCollectionJoinField, getCollectionFields } = useCollectionManager_deprecated();
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex();
  const record = ArrayBase.useRecord();
  const compile = useCompile();
  const { t } = useTranslation();
  const from = useForm();

  const traverseFields = ((cache) => {
    return (collectionName, { exclude = [], depth = 0, maxDepth, prefix = '', disabled = false }, formData) => {
      const cacheKey = `${collectionName}-${exclude.join(',')}-${depth}-${maxDepth}-${prefix}`;
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
      if (depth > maxDepth) {
        return [];
      }
      const result = getCollectionFields(collectionName)
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
            disabled,
          };
          const tatgetFormField = formData.find((v) => v.name === option.key);
          if (
            ['belongsTo', 'belongsToMany'].includes(field.type) &&
            (!tatgetFormField || ['Select', 'Picker'].includes(tatgetFormField?.fieldMode))
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
          } else if (
            ['hasOne', 'hasMany'].includes(field.type) ||
            ['Nester', 'SubTable'].includes(tatgetFormField?.fieldMode)
          ) {
            let childrenDisabled = false;
            if (
              ['hasOne', 'hasMany'].includes(field.type) &&
              ['Select', 'Picker'].includes(tatgetFormField?.fieldMode)
            ) {
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

      cache.set(cacheKey, result);
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

      const result = getCollectionFields(collectionName)
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
            type: 'preloading',
            tag: compile(field.uiSchema?.title) || field.name,
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
  const getEnableFieldTree = useCallback((collectionName: string, formData) => {
    if (!collectionName) {
      return [];
    }

    try {
      return traverseFields(collectionName, { exclude: ['id', ...systemKeys], maxDepth: 1, disabled: false }, formData);
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  return {
    async run() {
      const formData = new Set([]);
      const selectFields = new Set([]);
      const getAssociationAppends = (schema, str) => {
        schema?.reduceProperties?.((pre, s) => {
          const prefix = pre || str;
          const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
          const isAssociationSubfield = s.name.includes('.');
          const isAssociationField =
            collectionfield && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionfield.type);
          const fieldPath = !isAssociationField && isAssociationSubfield ? getAssociationPath(s.name) : s.name;
          const path = prefix === '' || !prefix ? fieldPath : prefix + '.' + fieldPath;
          if (
            collectionfield &&
            !(
              ['hasOne', 'hasMany'].includes(collectionfield.type) ||
              ['SubForm', 'Nester'].includes(s['x-component-props']?.mode)
            )
          ) {
            selectFields.add(path);
          }
          if (collectionfield && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
            formData.add({ name: path, fieldMode: s['x-component-props']['mode'] || 'Select' });
            if (['Nester', 'SubTable'].includes(s['x-component-props']?.mode)) {
              const bufPrefix = prefix && prefix !== '' ? prefix + '.' + s.name : s.name;
              getAssociationAppends(s, bufPrefix);
            }
          } else if (
            ![
              'ActionBar',
              'Action',
              'Action.Link',
              'Action.Modal',
              'Selector',
              'Viewer',
              'AddNewer',
              'AssociationField.Selector',
              'AssociationField.AddNewer',
              'TableField',
            ].includes(s['x-component'])
          ) {
            getAssociationAppends(s, str);
          }
        }, str);
      };
      getAssociationAppends(fieldSchema, '');
      const treeData = getEnableFieldTree(record?.collection || collection, [...formData]);
      if (callBack) {
        callBack(treeData, [...selectFields], from);
      } else {
        array?.field.form.query(`fieldReaction.items.${index}.layout.fields`).take((f: any) => {
          f.componentProps.treeData = [];
          setTimeout(() => (f.componentProps.treeData = treeData));
        });
        array?.field.value.splice(index, 1, {
          ...array?.field?.value[index],
          fields: [...selectFields],
          treeData: treeData,
        });
      }
      message.success(t('Sync successfully'));
    },
  };
};
