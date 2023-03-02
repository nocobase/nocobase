import { useField } from '@formily/react';
import React, { createContext, useMemo } from 'react';
import { useAssociation, useBlockRequestContext } from '../block-provider';
import { SharedFilter } from '../block-provider/SharedFilterProvider';
import { CollectionFieldOptions, useCollection } from '../collection-manager';

type Collection = ReturnType<typeof useCollection>;

export interface DataBlock {
  /** 唯一标识符，schema 中的 name 值 */
  name: string;
  /** 用户自行设置的区块名称 */
  title?: string;
  /** 与当前区块相关的数据表信息 */
  collection: Collection;
  /** 根据提供的参数执行该方法即可刷新数据区块的数据 */
  doFilter: (params: any) => Promise<void>;
  association?: CollectionFieldOptions;
  /** 存储筛选区块中的筛选条件 */
  filters: Record<string, SharedFilter>;
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
export const FilterBlockProvider = (props: any) => {
  const { children } = props;
  const value = useMemo(() => ({ dataBlocks: [] }), []);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

export const FilterBlockRecord = (props: any) => {
  const { children } = props;
  const collection = useCollection();
  const { recordDataBlocks } = useFilterBlock();
  const { service } = useBlockRequestContext();
  const field = useField();
  const association = useAssociation(props);

  // 表单类的区块不需要筛选
  if (field.decoratorType !== 'FormBlockProvider') {
    recordDataBlocks({
      name: field.props.name as string,
      title: field.componentProps.title,
      doFilter: service.runAsync,
      collection,
      association,
      filters: {},
    });
  }

  return <>{children}</>;
};

/**
 * 返回一些方法用于收集和获取当前页面中的数据区块的信息
 * @returns
 */
export const useFilterBlock = () => {
  const { dataBlocks } = React.useContext(FilterContext);
  return {
    recordDataBlocks: (block: DataBlock) => {
      // 避免重复收集
      if (!dataBlocks.find((item) => item.name === block.name)) {
        dataBlocks.push(block);
      }
    },
    getDataBlocks: () => dataBlocks,
  };
};
