import { GeneralField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { flatten, getValuesByPath } from '@nocobase/utils/client';
import _, { isString } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { isInFilterFormBlock } from '../../../filter-provider';
import { mergeFilter } from '../../../filter-provider/utils';
import { useRecord } from '../../../record-provider';
import { useParseDataScopeFilter } from '../../../schema-settings';
import { DEBOUNCE_WAIT } from '../../../variables';
import { getPath } from '../../../variables/utils/getPath';
import { getVariableName } from '../../../variables/utils/getVariableName';
import { isVariable } from '../../../variables/utils/isVariable';
import { useDesignable } from '../../hooks';
import { AssociationFieldContext } from './context';
import { Collection } from '../../../data-source';

export const useInsertSchema = (component) => {
  const fieldSchema = useFieldSchema();
  const { insertAfterBegin } = useDesignable();
  const insert = useCallback(
    (ss) => {
      const schema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.' + component) {
          return s;
        }
        return buf;
      }, null);
      if (!schema) {
        insertAfterBegin(cloneDeep(ss));
      }
    },
    [component],
  );
  return insert;
};

export function useAssociationFieldContext<F extends GeneralField>() {
  return useContext(AssociationFieldContext) as {
    options: any;
    field: F;
    currentMode: string;
    allowMultiple?: boolean;
    allowDissociate?: boolean;
  };
}

export default function useServiceOptions(props) {
  const { action = 'list', service, useOriginalFilter } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const record = useRecord();
  const { parseFilter, findVariable } = useParseDataScopeFilter();
  const [fieldServiceFilter, setFieldServiceFilter] = useState(null);

  useEffect(() => {
    const filterFromSchema = isString(fieldSchema?.['x-component-props']?.service?.params?.filter)
      ? field.componentProps?.service?.params?.filter
      : fieldSchema?.['x-component-props']?.service?.params?.filter;

    const _run = async () => {
      const result = await parseFilter(mergeFilter([filterFromSchema || service?.params?.filter]));
      setFieldServiceFilter(result);
    };
    const run = _.debounce(_run, DEBOUNCE_WAIT);

    _run();

    const dispose = reaction(() => {
      // 这一步主要是为了使 reaction 能够收集到依赖
      const flat = flatten(filterFromSchema, {
        breakOn({ key }) {
          return key.startsWith('$') && key !== '$and' && key !== '$or';
        },
        transformValue(value) {
          if (!isVariable(value)) {
            return value;
          }
          const variableName = getVariableName(value);
          const variable = findVariable(variableName);

          if (process.env.NODE_ENV !== 'production' && !variable) {
            throw new Error(`useServiceOptions: can not find variable ${variableName}`);
          }

          const result = getValuesByPath(
            {
              [variableName]: variable?.ctx || {},
            },
            getPath(value),
          );
          return result;
        },
      });
      return flat;
    }, run);

    return dispose;
  }, [
    field.componentProps?.service?.params?.filter,
    fieldSchema,
    findVariable,
    parseFilter,
    record,
    service?.params?.filter,
  ]);

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  }, [fieldSchema]);

  const sourceValue = record?.[collectionField?.sourceKey];
  const filter = useMemo(() => {
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    return mergeFilter(
      [
        mergeFilter([
          isOToAny && !isInFilterFormBlock(fieldSchema) && collectionField?.foreignKey && !useOriginalFilter
            ? {
                [collectionField.foreignKey]: {
                  $is: null,
                },
              }
            : null,
          fieldServiceFilter,
        ]),
        isOToAny &&
        sourceValue !== undefined &&
        sourceValue !== null &&
        !isInFilterFormBlock(fieldSchema) &&
        collectionField?.foreignKey &&
        !useOriginalFilter
          ? {
              [collectionField.foreignKey]: {
                $eq: sourceValue,
              },
            }
          : null,
        // params?.filter && value?.length
        //   ? {
        //       [fieldNames?.value]: {
        //         ['$in']: value,
        //       },
        //     }
        //   : null,
      ],
      '$or',
    );
  }, [
    collectionField?.interface,
    collectionField?.foreignKey,
    fieldSchema,
    fieldServiceFilter,
    sourceValue,
    useOriginalFilter,
  ]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}

export const useFieldNames = (props) => {
  const fieldSchema = useFieldSchema();
  const fieldNames =
    fieldSchema['x-component-props']?.['field']?.['uiSchema']?.['x-component-props']?.['fieldNames'] ||
    fieldSchema?.['x-component-props']?.['fieldNames'] ||
    props.fieldNames;
  return { label: 'label', value: 'value', ...fieldNames };
};

const SubFormContext = createContext<{
  value: any;
  collection: Collection;
}>(null);
SubFormContext.displayName = 'SubFormContext';
export const SubFormProvider = SubFormContext.Provider;

/**
 * 用于获取子表单所对应的 form 对象，其应该保持响应性，即一个 Proxy 对象；
 *
 * ## 为什么要有这个方法？
 * 1. 目前使用 useForm 方法获取到的是普通表单区块的 form 对象，无法通过简单的方法获取到子表单对应的 form 对象；
 * 2. 虽然现在 useRecord  也可以获取到相同值的对象，但是这个对象不是响应式的（因其内部 copy 过一次），字段值变更时无法监听到；
 * 3. 可能更好的方式是在 useForm 返回的 form 对象添加一个 parent 属性，但可能会影响其它部分的代码，所以暂时不做修改；
 * @returns
 */
export const useSubFormValue = () => {
  const { value, collection } = useContext(SubFormContext) || {};
  return {
    formValue: value,
    collection,
  };
};
