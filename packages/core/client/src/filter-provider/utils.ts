import { Schema } from '@formily/react';
import { useCollection } from '../collection-manager';
import { findFilterOperators } from '../schema-component/antd/form-item/SchemaSettingOptions';
import { useFilterBlock } from './FilterProvider';

export enum FilterBlockType {
  FORM,
  TABLE,
  TREE,
  COLLAPSE,
}

/**
 * 根据筛选区块类型筛选出支持的数据区块（同表或具有关系字段的表）
 * @param filterBlockType
 * @returns
 */
export const useSupportedBlocks = (filterBlockType: FilterBlockType) => {
  const { getDataBlocks } = useFilterBlock();
  const collection = useCollection();

  // Form 和 Collapse 仅支持同表的数据区块
  if (filterBlockType === FilterBlockType.FORM || filterBlockType === FilterBlockType.COLLAPSE) {
    return getDataBlocks().filter((block) => {
      return block.collection.name === collection.name;
    });
  }

  // Table 和 Tree 支持同表或者关系表的数据区块
  if (filterBlockType === FilterBlockType.TABLE || filterBlockType === FilterBlockType.TREE) {
    return getDataBlocks().filter((block) => {
      return block.collection.name === collection.name || block.association?.target === collection.name;
    });
  }
};

export const transformToFilter = (values: Record<string, any>, fieldSchema: Schema) => {
  const { operators } = findFilterOperators(fieldSchema);

  return {
    $and: Object.keys(values).map((key) => {
      return {
        [key]: {
          [operators[key]]: values[key],
        },
      };
    }),
  };
};
