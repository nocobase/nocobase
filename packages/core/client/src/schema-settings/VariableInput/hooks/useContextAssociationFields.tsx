/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { error } from '@nocobase/utils/client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useCompile, useGetFilterOptions } from '../../../schema-component';
import { FieldOption, Option } from '../type';

export const useIsSameOrChildCollection = () => {
  const { getChildrenCollections } = useCollectionManager_deprecated();
  return (contextCollection, targetCollection) => {
    if (contextCollection === targetCollection) {
      return true;
    }
    const children = getChildrenCollections(targetCollection);
    return children?.some((v) => v.name === contextCollection);
  };
};

interface GetOptionsParams {
  schema: any;
  depth: number;
  maxDepth?: number;
  loadChildren?: (option: Option) => Promise<void>;
  compile: (value: string) => any;
}

const getChildren = (
  options: FieldOption[],
  { schema, depth, maxDepth, loadChildren, compile }: GetOptionsParams,
  collectionField,
  getIsSameOrChildCollection,
): Option[] => {
  const result = options
    .map((option): Option => {
      const disabled = !getIsSameOrChildCollection(option.target, collectionField?.target);
      if (!option.target) {
        return {
          key: option.name,
          value: option.name,
          name: option.name,
          label: compile(option.title),
          title: compile(option.title),
          disabled: disabled,
          isLeaf: true,
          depth,
        };
      }

      if (depth >= maxDepth) {
        return null;
      }
      return {
        key: option.name,
        value: option.name,
        name: option.name,
        label: compile(option.title),
        title: compile(option.title),
        disabled: disabled,
        isLeaf: true,
        field: option,
        depth,
        loadChildren,
      };
    })
    .filter(Boolean);
  return result;
};

export const useContextAssociationFields = ({
  schema,
  maxDepth = 3,
  contextCollectionName,
  collectionField,
}: {
  schema?: any;
  maxDepth?: number;
  contextCollectionName: string;
  collectionField?: CollectionFieldOptions_deprecated;
}) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const getFilterOptions = useGetFilterOptions();
  const getIsSameOrChildCollection = useIsSameOrChildCollection();
  const loadChildren = (option: Option): Promise<void> => {
    if (!option.field?.target) {
      return new Promise((resolve) => {
        error('Must be set field target');
        option.children = [];
        resolve(void 0);
      });
    }

    const collectionName = option.field.target;
    return new Promise((resolve) => {
      setTimeout(() => {
        const children =
          getChildren(
            getFilterOptions(collectionName).filter((v) => {
              if (collectionField) {
                const isAssociationField = [
                  'hasOne',
                  'hasMany',
                  'belongsTo',
                  'belongsToMany',
                  'belongsToArray',
                ].includes(v.type);
                return isAssociationField;
              }
              return true;
            }),
            {
              schema,
              depth: option.depth + 1,
              maxDepth,
              loadChildren,
              compile,
            },
            collectionField,
            getIsSameOrChildCollection,
          ) || [];

        if (children.length === 0) {
          option.disabled = true;
          option.children = [];
          resolve();
          return;
        }
        option.children = children;
        resolve();

        // 延迟 5 毫秒，防止阻塞主线程，导致 UI 卡顿
      }, 5);
    });
  };

  const result = useMemo(() => {
    return {
      label: t('Table selected records'),
      value: '$context',
      key: '$context',
      isLeaf: false,
      field: {
        target: contextCollectionName,
      },
      depth: 0,
      loadChildren,
    } as Option;
  }, [schema?.['x-component']]);

  return result;
};
