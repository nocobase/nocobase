import { useField } from '@formily/react';
import React, { createContext } from 'react';
import { useBlockRequestContext } from '../block-provider';
import { useCollection } from '../collection-manager';

type Collection = ReturnType<typeof useCollection>;

interface DataBlock {
  /** 唯一标识符，schema 中的 name 值 */
  name: string;
  /** 与当前区块相关的数据表信息 */
  collection: Collection;
  /** 根据提供的参数执行该方法即可刷新数据区块的数据 */
  doFilter: (params: any) => void;
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
export const FilterProvider = (props: any) => {
  const { children } = props;
  const dataBlocks = [];
  return <FilterContext.Provider value={{ dataBlocks }}>{children}</FilterContext.Provider>;
};

export const FilterRecord = (props: any) => {
  const { children } = props;
  const collection = useCollection();
  const { recordDataBlocks } = useFilter();
  const { service } = useBlockRequestContext();
  const field = useField();

  recordDataBlocks({
    name: field.props.name as string,
    collection,
    doFilter: service.run,
  });

  return <>{children}</>;
};

/**
 * 返回一些方法用于收集和获取当前页面中的数据区块的信息
 * @returns
 */
export const useFilter = () => {
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
