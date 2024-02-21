import { Schema, useFieldSchema } from '@formily/react';
import { flatten, getValuesByPath } from '@nocobase/utils/client';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { FilterTarget, findFilterTargets } from '../block-provider/hooks';
import {
  Collection_deprecated,
  CollectionFieldOptions_deprecated,
  FieldOptions,
  useCollection_deprecated,
  useCollectionManager_deprecated,
} from '../collection-manager';
import { removeNullCondition } from '../schema-component';
import { findFilterOperators } from '../schema-component/antd/form-item/SchemaSettingOptions';
import { DataBlock, useFilterBlock } from './FilterProvider';

export enum FilterBlockType {
  FORM,
  TABLE,
  TREE,
  COLLAPSE,
}

export const mergeFilter = (filters: any[], op = '$and') => {
  const items = filters.filter((f) => {
    if (f && typeof f === 'object' && !Array.isArray(f)) {
      return Object.values(f).filter((v) => v !== undefined).length;
    }
  });
  if (items.length === 0) {
    return {};
  }
  if (items.length === 1) {
    return items[0];
  }
  return { [op]: items };
};

export const getSupportFieldsByAssociation = (inheritCollectionsChain: string[], block: DataBlock) => {
  return block.associatedFields?.filter(
    (field) => inheritCollectionsChain?.some((collectionName) => collectionName === field.target),
  );
};

export const getSupportFieldsByForeignKey = (
  filterBlockCollection: ReturnType<typeof useCollection_deprecated>,
  block: DataBlock,
) => {
  return block.foreignKeyFields?.filter((foreignKeyField) => {
    return filterBlockCollection.fields.some(
      (field) => field.type !== 'belongsTo' && field.foreignKey === foreignKeyField.name,
    );
  });
};

/**
 * 根据筛选区块类型筛选出支持的数据区块（同表或具有关系字段的表）
 * @param filterBlockType
 * @returns
 */
export const useSupportedBlocks = (filterBlockType: FilterBlockType) => {
  const { getDataBlocks } = useFilterBlock();
  const fieldSchema = useFieldSchema();
  const collection = useCollection_deprecated();
  const { getAllCollectionsInheritChain } = useCollectionManager_deprecated();

  // Form 和 Collapse 仅支持同表的数据区块
  if (filterBlockType === FilterBlockType.FORM || filterBlockType === FilterBlockType.COLLAPSE) {
    return getDataBlocks().filter((block) => {
      return isSameCollection(block.collection, collection);
    });
  }

  // Table 和 Tree 支持同表或者关系表的数据区块
  if (filterBlockType === FilterBlockType.TABLE || filterBlockType === FilterBlockType.TREE) {
    return getDataBlocks().filter((block) => {
      // 1. 同表
      // 2. 关系字段
      // 3. 外键字段
      return (
        fieldSchema['x-uid'] !== block.uid &&
        (isSameCollection(block.collection, collection) ||
          getSupportFieldsByAssociation(getAllCollectionsInheritChain(collection.name, collection.dataSource), block)
            ?.length ||
          getSupportFieldsByForeignKey(collection, block)?.length)
      );
    });
  }
};

export const transformToFilter = (
  values: Record<string, any>,
  fieldSchema: Schema,
  getCollectionJoinField: (name: string) => CollectionFieldOptions_deprecated,
  collectionName: string,
) => {
  const { operators } = findFilterOperators(fieldSchema);

  values = flatten(values, {
    breakOn({ value, path }) {
      // 下面操作符的值是一个数组，需要特殊处理
      if (
        [
          '$match',
          '$notMatch',
          '$anyOf',
          '$noneOf',
          '$childIn',
          '$childNotIn',
          '$dateBetween',
          '$in',
          '$notIn',
        ].includes(operators[path])
      ) {
        return true;
      }

      const collectionField = getCollectionJoinField(`${collectionName}.${path}`);
      if (collectionField?.target) {
        if (Array.isArray(value)) {
          return true;
        }
        const targetKey = collectionField.targetKey || 'id';
        if (value && value[targetKey] != null) {
          return true;
        }
      }
      return false;
    },
  });

  const result = {
    $and: Object.keys(values)
      .map((key) => {
        let value = _.get(values, key);
        const collectionField = getCollectionJoinField(`${collectionName}.${key}`);

        if (collectionField?.target) {
          value = getValuesByPath(value, collectionField.targetKey || 'id');
          key = `${key}.${collectionField.targetKey || 'id'}`;
        }

        if (!value) {
          return null;
        }

        return {
          [key]: {
            [operators[key] || '$eq']: value,
          },
        };
      })
      .filter(Boolean),
  };

  return result;
};

export const useAssociatedFields = () => {
  const { fields } = useCollection_deprecated();

  return fields.filter((field) => isAssocField(field)) || [];
};

export const isAssocField = (field?: FieldOptions) => {
  return ['o2o', 'oho', 'obo', 'm2o', 'createdBy', 'updatedBy', 'o2m', 'm2m', 'linkTo', 'chinaRegion'].includes(
    field?.interface,
  );
};

export const isSameCollection = (c1: Collection_deprecated, c2: Collection_deprecated) => {
  return c1.name === c2.name && c1.dataSource === c2.dataSource;
};

export const useFilterAPI = () => {
  const fieldSchema = useFieldSchema();
  const { getDataBlocks } = useFilterBlock();
  const { targets, uid } = findFilterTargets(fieldSchema);
  const dataBlocks = getDataBlocks();
  const [isConnected, setIsConnected] = useState(() => {
    return targets && targets.some((target) => dataBlocks.some((dataBlock) => dataBlock.uid === target.uid));
  });
  const targetsKeys = Object.keys(targets || {});

  useEffect(() => {
    setIsConnected(targets && targets.some((target) => dataBlocks.some((dataBlock) => dataBlock.uid === target.uid)));
  }, [targetsKeys.length, dataBlocks]);

  const doFilter = useCallback(
    (
      value,
      field: string | ((target: FilterTarget['targets'][0]) => string) = 'id',
      operator: string | ((target: FilterTarget['targets'][0]) => string) = '$eq',
    ) => {
      dataBlocks.forEach((block) => {
        const target = targets.find((target) => target.uid === block.uid);
        if (!target) return;

        if (_.isFunction(field)) {
          field = field(target);
        }
        if (_.isFunction(operator)) {
          operator = operator(target);
        }

        const param = block.service.params?.[0] || {};
        // 保留原有的 filter
        const storedFilter = block.service.params?.[1]?.filters || {};

        if (value !== undefined) {
          storedFilter[uid] = {
            $and: [
              {
                [field]: {
                  [operator]: value,
                },
              },
            ],
          };
        } else {
          delete storedFilter[uid];
        }

        const mergedFilter = mergeFilter([
          ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
          block.defaultFilter,
        ]);

        block.doFilter(
          {
            ...param,
            page: 1,
            filter: mergedFilter,
          },
          { filters: storedFilter },
        );
      });
    },
    [dataBlocks],
  );

  return {
    /** 当前区块是否已连接其它区块 */
    isConnected,
    /** 调用该方法进行过滤 */
    doFilter,
  };
};

export const isInFilterFormBlock = (fieldSchema: Schema) => {
  while (fieldSchema) {
    if (fieldSchema['x-filter-targets']) {
      return fieldSchema['x-decorator'] === 'FilterFormBlockProvider';
    }
    fieldSchema = fieldSchema.parent;
  }
  return false;
};
