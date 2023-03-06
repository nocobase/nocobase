import { useField } from '@formily/react';
import React, { createContext, useEffect, useRef } from 'react';
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
  /** 通过右上角菜单设置的过滤条件 */
  defaultFilter?: SharedFilter;
  service?: any;
  /** 区块所对应的 DOM 容器 */
  dom: HTMLElement;
}

interface FilterContextValue {
  dataBlocks: DataBlock[];
  setDataBlocks: React.Dispatch<React.SetStateAction<DataBlock[]>>;
}

const FilterContext = createContext<FilterContextValue>(null);

/**
 * 主要用于记录当前页面中的数据区块的信息，用于在过滤区块中使用
 * @param props
 * @returns
 */
export const FilterBlockProvider: React.FC = ({ children }) => {
  const [dataBlocks, setDataBlocks] = React.useState<DataBlock[]>([]);
  return <FilterContext.Provider value={{ dataBlocks, setDataBlocks }}>{children}</FilterContext.Provider>;
};

export const FilterBlockRecord = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: { filter: SharedFilter };
}) => {
  const collection = useCollection();
  const { recordDataBlocks, removeDataBlock } = useFilterBlock();
  const { service } = useBlockRequestContext();
  const field = useField();
  const associatedFields = useAssociatedFields();
  const container = useRef(null);

  const shouldApplyFilter = field.decoratorType !== 'FormBlockProvider' && field.decoratorProps.blockType !== 'filter';

  const addBlockToDataBlocks = () => {
    recordDataBlocks({
      name: field.props.name as string,
      title: field.componentProps.title,
      doFilter: service.runAsync,
      collection,
      associatedFields,
      defaultFilter: params.filter || {},
      service,
      dom: container.current,
    });
  };

  useEffect(() => {
    if (shouldApplyFilter) addBlockToDataBlocks();
  }, [params?.filter, service]);

  useEffect(() => {
    return () => {
      removeDataBlock(field.props.name as string);
    };
  }, []);

  return <div ref={container}>{children}</div>;
};

/**
 * 返回一些方法用于收集和获取当前页面中的数据区块的信息
 * @returns
 */
export const useFilterBlock = () => {
  const { dataBlocks, setDataBlocks } = React.useContext(FilterContext);
  const recordDataBlocks = (block: DataBlock) => {
    const existingBlock = dataBlocks.find((item) => item.name === block.name);

    if (existingBlock) {
      // 这里的值有可能会变化，所以需要更新
      existingBlock.service = block.service;
      existingBlock.defaultFilter = block.defaultFilter;
      return;
    }

    setDataBlocks((prev) => [...prev, block]);
  };
  const getDataBlocks = () => dataBlocks;
  const removeDataBlock = (name: string) => {
    setDataBlocks((prev) => prev.filter((item) => item.name !== name));
  };

  return { recordDataBlocks, getDataBlocks, removeDataBlock };
};
