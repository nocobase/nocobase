/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { CollectionFieldOptions_deprecated } from '../collection-manager';
import { Collection } from '../data-source/collection/Collection';
import { useCollection } from '../data-source/collection/CollectionProvider';
import { useDataBlockRequestGetter } from '../data-source/data-block/DataBlockRequestProvider';
import { useDataLoadingMode } from '../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';
import { removeNullCondition } from '../schema-component';
import { mergeFilter, useAssociatedFields } from './utils';

// @ts-ignore
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAllDataBlocks } from '../schema-component/antd/page/AllDataBlocksProvider';

enum FILTER_OPERATOR {
  AND = '$and',
  OR = '$or',
}

export type FilterParam = {
  [K in FILTER_OPERATOR]?: any;
};

export interface ForeignKeyField {
  /** 外键字段所在的数据表的名称 */
  collectionName: string;
  isForeignKey: boolean;
  key: string;
  name: string;
  parentKey: null | string;
  reverseKey: null | string;

  [key: string]: any;
}

export interface DataBlock {
  /** 唯一标识符，schema 中的 x-uid 值 */
  uid: string;
  /** 用户自行设置的区块名称 */
  title?: string;
  /** 与数据区块相关的数据表信息 */
  collection: Collection;
  /** 根据提供的参数执行该方法即可刷新数据区块的数据 */
  doFilter: (params: any, params2?: any) => Promise<void>;
  /** 清除筛选区块设置的筛选参数 */
  clearFilter: (uid: string) => void;
  /** 将数据区块的数据置为空 */
  clearData: () => void;
  /** 清除表格的选中项 */
  clearSelection?: () => void;
  /** 数据区块表中所有的关系字段 */
  associatedFields?: CollectionFieldOptions_deprecated[];
  /** 数据区块表中所有的外键字段 */
  foreignKeyFields?: ForeignKeyField[];
  /** 数据区块已经存在的过滤条件（通过 `设置数据范围` 或者其它能设置筛选条件的功能） */
  defaultFilter?: FilterParam;
  /** 数据区块用于请求数据的接口 */
  service?: any;
  /** 数据区块所的 DOM 容器 */
  dom: HTMLElement;
  /**
   * auto: 数据区块会在初始渲染时请求数据
   * manual: 只有当点击了筛选按钮，才会请求数据
   */
  dataLoadingMode?: 'auto' | 'manual';
  /** 让整个区块悬浮起来 */
  highlightBlock: () => void;
  /** 取消悬浮 */
  unhighlightBlock: () => void;
}

interface FilterContextValue {
  getDataBlocks: () => DataBlock[];
  setDataBlocks: (value: DataBlock[] | ((prev: DataBlock[]) => DataBlock[])) => void;
}

const FilterContext = createContext<FilterContextValue>(null);
FilterContext.displayName = 'FilterContext';

/**
 * 主要用于记录当前页面中的数据区块的信息，用于在过滤区块中使用
 * @param props
 * @returns
 */
export const FilterBlockProvider: React.FC = React.memo(({ children }) => {
  const dataBlocksRef = React.useRef<DataBlock[]>([]);

  const setDataBlocks = useCallback((value) => {
    if (typeof value === 'function') {
      dataBlocksRef.current = value(dataBlocksRef.current);
    } else {
      dataBlocksRef.current = value;
    }
  }, []);

  const getDataBlocks = useCallback(() => dataBlocksRef.current, []);

  const value = useMemo(() => ({ getDataBlocks, setDataBlocks }), [getDataBlocks, setDataBlocks]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
});

FilterBlockProvider.displayName = 'FilterBlockProvider';

/**
 * 用于收集当前页面中的数据区块的信息，用于在过滤区块中使用
 * @param param0
 * @returns
 */
export const DataBlockCollector = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: { filter?: FilterParam };
}) => {
  const collection = useCollection();
  const { recordDataBlocks } = useFilterBlock();
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const associatedFields = useAssociatedFields();
  const container = useRef<HTMLDivElement | null>(null);
  const dataLoadingMode = useDataLoadingMode();

  const shouldApplyFilter =
    field &&
    field.decoratorType !== 'FilterFormBlockProvider' &&
    field.decoratorType !== 'FormBlockProvider' &&
    field.decoratorProps.blockType !== 'filter';

  const addBlockToDataBlocks = useCallback(() => {
    const service = getDataBlockRequest();
    recordDataBlocks({
      uid: fieldSchema['x-uid'],
      title: field.componentProps.title,
      doFilter: service.runAsync as any,
      collection,
      associatedFields,
      foreignKeyFields: collection?.getFields('isForeignKey') as ForeignKeyField[],
      defaultFilter: params?.filter || {},
      service,
      dom: container.current,
      dataLoadingMode,
      clearFilter(uid: string) {
        const param = this.service.params?.[0] || {};
        const storedFilter = this.service.params?.[1]?.filters || {};
        delete storedFilter[uid];
        const mergedFilter = mergeFilter([
          ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
          params?.filter || {},
        ]);

        this.service.run(
          {
            ...param,
            page: 1,
            filter: mergedFilter,
          },
          { filters: storedFilter },
        );
      },
      clearData() {
        this.service.mutate(undefined);
      },
      clearSelection() {
        if (field) {
          field.data?.clearSelectedRowKeys?.();
        }
      },
      highlightBlock() {
        const dom = container.current;

        if (!dom) return;

        const designer = dom.querySelector('.ant-nb-schema-toolbar');
        if (designer) {
          designer.classList.remove(process.env.__E2E__ ? 'hidden-e2e' : 'hidden');
        }
        dom.style.boxShadow = '0 3px 12px rgba(0, 0, 0, 0.15)';
        dom.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';
        dom.scrollIntoView?.({
          behavior: 'smooth',
          block: 'start',
        });
      },
      unhighlightBlock() {
        const dom = container.current;

        if (!dom) return;

        const designer = dom.querySelector('.ant-nb-schema-toolbar');
        if (designer) {
          designer.classList.add(process.env.__E2E__ ? 'hidden-e2e' : 'hidden');
        }
        dom.style.boxShadow = 'none';
        dom.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';
      }
    });
  }, [
    associatedFields,
    collection,
    dataLoadingMode,
    fieldSchema,
    params?.filter,
    recordDataBlocks,
    getDataBlockRequest,
    field,
  ]);

  useEffect(() => {
    if (shouldApplyFilter) addBlockToDataBlocks();
  }, [addBlockToDataBlocks, shouldApplyFilter]);

  return <div ref={container}>{children}</div>;
};

/**
 * 返回一些方法用于收集和获取当前页面中的数据区块的信息
 * @returns
 */
export const useFilterBlock = () => {
  const ctx = React.useContext(FilterContext);
  const allDataBlocksCtx = useAllDataBlocks();

  // 有可能存在页面没有提供 FilterBlockProvider 的情况，比如内部使用的数据表管理页面
  const getDataBlocks = useCallback<() => DataBlock[]>(() => ctx?.getDataBlocks() || [], [ctx]);

  const recordDataBlocks = useCallback(
    (block: DataBlock) => {
      allDataBlocksCtx.recordDataBlocks(block);
      const existingBlock = ctx?.getDataBlocks().find((item) => item.uid === block.uid);

      if (existingBlock) {
        // 这里的值有可能会变化，所以需要更新
        Object.assign(existingBlock, block);
        return;
      }

      ctx?.setDataBlocks((prev) => [...prev, block]);
    },
    [ctx],
  );

  const removeDataBlock = useCallback(
    (uid: string) => {
      allDataBlocksCtx.removeDataBlock(uid);
      if (ctx?.getDataBlocks().every((item) => item.uid !== uid)) return;
      ctx?.setDataBlocks((prev) => prev.filter((item) => item.uid !== uid));
    },
    [ctx],
  );

  if (!ctx) {
    return {
      inProvider: false,
      recordDataBlocks: _.noop,
      getDataBlocks,
      removeDataBlock: _.noop,
    };
  }

  return {
    recordDataBlocks,
    getDataBlocks,
    removeDataBlock,
    /**
     * running in FilterBlockProvider
     */
    inProvider: true,
  };
};
