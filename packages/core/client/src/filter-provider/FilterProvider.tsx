import { useField } from '@formily/react';
import React, { createContext, useMemo } from 'react';
import { useBlockRequestContext } from '../block-provider';
import { SharedFilter } from '../block-provider/SharedFilterProvider';
import { CollectionFieldOptions, useCollection } from '../collection-manager';
import { useAssociatedFields } from './utils';

type Collection = ReturnType<typeof useCollection>;

export interface DataBlock {
  /** 唯一标识符，schema 中的 name 值 */
  name: string;
  /** 用户自行设置的区块名称 */
  title?: string;
  /** 与当前区块相关的数据表信息 */
  collection: Collection;
  /** 根据提供的参数执行该方法即可刷新数据区块的数据 */
  doFilter: (params: any, params2?: any) => Promise<void>;
  /** 数据区块表中所有的关系字段 */
  associatedFields?: CollectionFieldOptions[];
  /** 存储筛选区块中的筛选条件 */
  filters: Record<string, SharedFilter>;
  service?: any;
}

interface FilterContextValue {
  dataBlocks: DataBlock[];
}

const FilterContext = createContext<FilterContextValue>(null);

/**
 * 主要用于记录当前页面中的数据区块的信息，用于在过滤区块中使用
 * @param props
 * @returns
 */
export const FilterBlockProvider: React.FC = ({ children }) => {
  const value = useMemo(() => ({ dataBlocks: [] }), []);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const FilterBlockRecord = ({ children }: { children: React.ReactNode }) => {
  const collection = useCollection();
  const { recordDataBlocks } = useFilterBlock();
  const { service } = useBlockRequestContext();
  const field = useField();
  const associatedFields = useAssociatedFields();

  const shouldApplyFilter = field.decoratorType !== 'FormBlockProvider' && field.decoratorProps.blockType !== 'filter';

  const addBlockToDataBlocks = () => {
    recordDataBlocks({
      name: field.props.name as string,
      title: field.componentProps.title,
      doFilter: service.runAsync,
      collection,
      associatedFields,
      filters: {},
      service,
    });
  };

  if (shouldApplyFilter) addBlockToDataBlocks();

  return <>{children}</>;
};

/**
 * 返回一些方法用于收集和获取当前页面中的数据区块的信息
 * @returns
 */
export const useFilterBlock = () => {
  const { dataBlocks } = React.useContext(FilterContext);
  const recordDataBlocks = (block: DataBlock) => {
    const existingBlock = dataBlocks.find((item) => item.name === block.name);

    if (existingBlock) {
      // 需要更新一下 service，以获取最新的状态
      existingBlock.service = block.service;
      return;
    }

    dataBlocks.push(block);
  };
  const getDataBlocks = () => dataBlocks;

  return { recordDataBlocks, getDataBlocks };
};
