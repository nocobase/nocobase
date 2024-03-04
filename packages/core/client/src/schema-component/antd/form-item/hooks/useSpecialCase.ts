import { Field } from '@formily/core';
import { Schema, useFieldSchema, useForm } from '@formily/react';
import _ from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import {
  CollectionFieldOptions_deprecated,
  useCollection_deprecated,
  useCollectionManager_deprecated,
} from '../../../../collection-manager';
import { isSubMode } from '../../association-field/util';
import { markRecordAsNew } from '../../../../data-source/collection-record/isNewRecord';

/**
 * #### 处理 `子表单` 和 `子表格` 中的特殊情况
 *
 * - 提供一个判断当前是否是特殊情况的方法
 * - 提供一个设置默认值的方法
 */
export const useSpecialCase = () => {
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const { getCollectionField } = useCollectionManager_deprecated();

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name);
  }, [fieldSchema.name, getField]);

  const isSpecialCase = useCallback(() => {
    return isSpecialCaseField({ collectionField, fieldSchema, getCollectionField });
  }, [collectionField, fieldSchema, getCollectionField]);

  const setDefaultValue = useCallback(
    (value: any) => {
      const parentFieldSchema = getParentFieldSchema(fieldSchema);
      if (parentFieldSchema) {
        const parentField: any = form.query(parentFieldSchema.name).take();
        if (parentField) {
          parentField.setInitialValue(transformValue(value, { field: parentField, subFieldSchema: fieldSchema }));
        }
      }
    },
    [fieldSchema, form],
  );

  return {
    /**
     * 特殊情况指的是：当前字段是 `对一` 字段且存在于 `对多` 字段的 `子表格` 或 `子表单` 中
     * 详细说明见：https://nocobase.feishu.cn/docx/EmNEdEBOnoQohUx2UmBcqIQ5nyh#CUdLdy6OpoPKjyx9DLPc3lqknVc
     */
    isSpecialCase,
    setDefaultValue,
  };
};

/**
 * 通过存在于 `子表格` 和 `子表单` 中的字段，获取父级字段的 fieldSchema
 * @param fieldSchema
 */
export function getParentFieldSchema(fieldSchema: Schema) {
  while (fieldSchema?.parent) {
    fieldSchema = fieldSchema.parent;

    if (isSubMode(fieldSchema)) {
      return fieldSchema;
    }
  }

  return fieldSchema;
}

/**
 * 特殊情况指的是：当前字段是 `对一` 字段且存在于 `对多` 字段的 `子表格` 或 `子表单` 中
 * 详细说明见：https://nocobase.feishu.cn/docx/EmNEdEBOnoQohUx2UmBcqIQ5nyh#CUdLdy6OpoPKjyx9DLPc3lqknVc
 * @returns
 */
export function isSpecialCaseField({
  collectionField,
  fieldSchema,
  getCollectionField,
}: {
  collectionField: CollectionFieldOptions_deprecated;
  fieldSchema: Schema;
  getCollectionField: (name: string) => CollectionFieldOptions_deprecated;
}) {
  if (collectionField && ['hasOne', 'belongsTo'].includes(collectionField.type) && fieldSchema) {
    const parentFieldSchema = getParentFieldSchema(fieldSchema);
    if (parentFieldSchema && parentFieldSchema['x-collection-field']) {
      const parentCollectionField = getCollectionField(parentFieldSchema['x-collection-field']);
      if (['hasMany', 'belongsToMany'].includes(parentCollectionField?.type)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 将 `对多` 字段的子表单或子表格中的 `对一` 字段的值转换成 `对多` 字段的值
 * @param value `子表单` 和 `子表格` 中的 `对一` 字段的经过解析之后的变量的值
 * @param deps
 * @returns
 */
export function transformValue(
  value: any,
  deps: {
    field: Field;
    subFieldSchema: Schema;
  },
) {
  const { field, subFieldSchema } = deps;
  const oldValues = field.value;
  let newValues = null;

  if (Array.isArray(value)) {
    newValues = value.map((item) => {
      return {
        [subFieldSchema.name]: item,
      };
    });
  } else {
    newValues = [
      {
        [subFieldSchema.name]: value,
      },
    ];
  }

  const result = _.assignWith([...oldValues], newValues, (oldValue, newValue) => {
    if (!oldValue && newValue) {
      // 用于标记这个值不是从数据库中获取的
      newValue.__notFromDatabase = true;
    }

    // 之所以取第一个值，是因为 `对一` 字段的默认值可能是异步的，导致会赋默认值值会晚于普通字段，导致普通字段的值会被覆盖
    return _.assign({ ...oldValues[0] }, newValue);
  });

  return result;
}

/**
 * 判断一个 record 是否是从数据库中获取的，如果是则返回 true，否则返回 false
 * @param value useRecord  返回的值
 * @returns boolean
 */
export function isFromDatabase(value: Record<string, any>) {
  if (!value) {
    return false;
  }

  return !value.__notFromDatabase;
}

/**
 * 解决 `子表格` 中的 “一对多/多对一” 字段的默认值问题。
 *
 * 问题：如果子表格是空的，会导致默认值不会被设置，这是因为子表格中没有 FormItem 渲染，而设置默认值的逻辑就在 FormItem 中。
 *
 * 解决方法：
 * 1. 如果子表格是空的，就设置一个值，这样会渲染出 FormItem。
 * 2. 在 FormItem 中会设置默认值。
 * 3. 如果子表格中没有设置默认值，就会再把子表格重置为空。
 * @param param0
 */
export const useSubTableSpecialCase = ({ field }) => {
  useEffect(() => {
    if (_.isEmpty(field.value)) {
      const value = field.value;
      field.value = [markRecordAsNew({})];
      // 因为默认值的解析是异步的，所以下面的代码会优先于默认值的设置，这样就防止了设置完默认值后又被清空的问题
      setTimeout(() => {
        field.value = value;
      });
    }
  }, []);
};
