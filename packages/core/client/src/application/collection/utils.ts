import { CascaderProps } from 'antd';
import _ from 'lodash';
import type { CollectionManagerV2 } from './CollectionManager';
import { CollectionFieldOptionsV2 } from './Collection';

export function getCollectionFieldsOptions(
  collectionName: string,
  type: string | string[] = 'string',
  opts: {
    collectionManager: CollectionManagerV2;
    compile: (str: string) => string;
    cached?: Record<string, any>;
    collectionNames?: string[];
    /**
     * 为 true 时允许查询所有关联字段
     * 为 Array<string> 时仅允许查询指定的关联字段
     */
    association?: boolean | string[];
    /**
     * Max depth of recursion
     */
    maxDepth?: number;
    allowAllTypes?: boolean;
    /**
     * 排除这些接口的字段
     */
    exceptInterfaces?: string[];
    /**
     * field value 的前缀，用 . 连接，比如 a.b.c
     */
    prefixFieldValue?: string;
    /**
     * 是否使用 prefixFieldValue 作为 field value
     */
    usePrefix?: boolean;
  },
) {
  const {
    association = false,
    cached = {},
    collectionNames = [collectionName],
    maxDepth = 1,
    allowAllTypes = false,
    exceptInterfaces = [],
    prefixFieldValue = '',
    compile,
    collectionManager,
    usePrefix = false,
  } = opts || {};

  if (collectionNames.length - 1 > maxDepth) {
    return;
  }

  if (cached[collectionName]) {
    // avoid infinite recursion
    return _.cloneDeep(cached[collectionName]);
  }

  if (typeof type === 'string') {
    type = [type];
  }
  const fields = collectionManager.getCollectionFields(collectionName);
  const options = fields
    ?.filter(
      (field) =>
        field.interface &&
        !exceptInterfaces.includes(field.interface) &&
        (allowAllTypes ||
          type.includes(field.type) ||
          (association && field.target && field.target !== collectionName && Array.isArray(association)
            ? association.includes(field.interface)
            : false)),
    )
    ?.map((field) => {
      const result: CascaderProps<any>['options'][0] = {
        value: usePrefix && prefixFieldValue ? `${prefixFieldValue}.${field.name}` : field.name,
        label: compile(field?.uiSchema?.title) || field.name,
        ...field,
      };
      if (association && field.target) {
        result.children = collectionNames.includes(field.target)
          ? []
          : getCollectionFieldsOptions(field.target, type, {
              ...opts,
              cached,
              collectionManager,
              compile,
              collectionNames: [...collectionNames, field.target],
              prefixFieldValue: usePrefix ? (prefixFieldValue ? `${prefixFieldValue}.${field.name}` : field.name) : '',
              usePrefix,
            });
        if (!result.children?.length) {
          return null;
        }
      }
      return result;
    })
    // 过滤 map 产生为 null 的数据
    .filter(Boolean);

  cached[collectionName] = options;
  return options;
}

export const isTitleField = (cm: CollectionManagerV2, field: CollectionFieldOptionsV2) => {
  return !field.isForeignKey && cm.getCollectionFieldInterface(field.interface)?.titleUsable;
};
