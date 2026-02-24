/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CardItemProps,
  FilterContext,
  FilterDynamicComponent,
  mergeFilter,
  useApp,
  useCollection,
  useDataBlockHeight,
  useDataBlockProps,
  useDataBlockRequest,
  useFilterAPI,
} from '@nocobase/client';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { treeFind } from '@nocobase/utils/client';
import React from 'react';
import { TreeProps } from '../component';
import { BlockName } from '../constants';
import { treeSettings } from '../settings';

export function useCollectionKey() {
  const collection = useCollection();
  return collection.filterTargetKey;
}

const SEARCH_HEIGHT = 90;

export function useTreeProps(): TreeProps {
  const { data, run, loading } = useDataBlockRequest<any[]>();
  const { tree, params } = useDataBlockProps();
  const collection = useCollection();
  const key = useCollectionKey();
  const app = useApp();
  const title = collection.titleField || key;
  const { isConnected, doFilter } = useFilterAPI();
  const height = useDataBlockHeight({ removeBlockHeaderHeight: true, innerExtraHeight: SEARCH_HEIGHT });

  const fieldNames = useMemo(
    () => ({
      key,
      title,
      ...tree?.fieldNames,
    }),
    [key, collection, tree?.fieldNames],
  );

  const collectionField = useMemo(() => {
    return collection.getField(fieldNames.title);
  }, [fieldNames.title, collection]);

  const filterFieldInterface = useMemo(() => {
    const interfaceValue = collectionField.interface;
    if (!interfaceValue) return null;
    return app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(interfaceValue);
  }, [collectionField]);

  const operator = useMemo(() => {
    return filterFieldInterface?.filterable?.operators?.[0];
  }, [filterFieldInterface]);
  const searchValue = useRef<any>();
  const onSearch: TreeProps['onSearch'] = useCallback(
    (value) => {
      searchValue.current = value;
      const filter =
        value === '' || value == undefined
          ? {}
          : { $and: [{ [fieldNames.title]: { [operator?.value || '$eq']: value } }] };
      run({
        filter: mergeFilter([params?.filter, filter]),
      });
    },
    [fieldNames.title, JSON.stringify(params?.filter), operator?.value, run],
  );

  useEffect(() => {
    onSearch(searchValue.current);
  }, [JSON.stringify(params?.filter)]);

  const onSelect: TreeProps['onSelect'] = useCallback(
    (selectedKeys) => {
      if (!isConnected) return;

      if (selectedKeys.length === 0) {
        doFilter(null);
      } else {
        doFilter(
          (target, block, sourceKey) => {
            if (target?.field) {
              const field = block.collection.getField(target.field);
              const selectedRecord = treeFind(data?.data, (item) => item[key] === selectedKeys[0]);

              return selectedRecord?.[sourceKey || field.name];
            }

            return selectedKeys[0];
          },
          (target) => {
            return target?.field || key;
          },
        );
      }
    },
    [isConnected, doFilter, data?.data, key],
  );

  const schema = useMemo(() => {
    return {
      ...collectionField?.uiSchema,
      ...operator?.schema,
    };
  }, [operator]);

  const FilterComponent = useCallback(
    ({ value, onChange }) => {
      return (
        <FilterContext.Provider value={{}}>
          <FilterDynamicComponent
            value={value}
            schema={schema}
            collectionField={collectionField}
            onChange={onChange}
            style={{ width: '100%' }}
            componentProps={{ allowClear: true }}
          />
        </FilterContext.Provider>
      );
    },
    [schema, collectionField],
  );

  return {
    ...tree,
    height,
    loading,
    fieldNames,
    treeData: data?.data,
    onSearch,
    onSelect,
    FilterComponent,
  };
}

export interface GetTreeSchemaProps {
  dataSource?: string;
  collection: string;
  props?: TreeProps;
  cardProps?: CardItemProps;
  isTreeCollection?: boolean;
}

export function getTreeSchema(options: GetTreeSchemaProps) {
  const { dataSource, collection, isTreeCollection, props = {}, cardProps = {} } = options;
  return {
    type: 'void',
    'x-decorator': 'DataBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection,
      action: 'list',
      params: {
        pageSize: 200,
        tree: isTreeCollection ? true : undefined,
      },
      tree: props as TreeProps,
    },
    'x-component': 'CardItem',
    'x-component-props': cardProps,
    'x-settings': treeSettings.name,
    'x-toolbar': 'BlockSchemaToolbar',
    'x-filter-targets': [],
    properties: {
      tree: {
        type: 'void',
        'x-component': BlockName,
        'x-use-component-props': 'useTreeProps',
      },
    },
  };
}
