import { GeneralField } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { flatten } from '@nocobase/utils/client';
import _, { isString } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { isInFilterFormBlock } from '../../../filter-provider';
import { useRecord } from '../../../record-provider';
import { useParseDataScopeFilter } from '../../../schema-settings';
import { DEBOUNCE_WAIT } from '../../../variables';
import { getPath } from '../../../variables/utils/getPath';
import { isVariable } from '../../../variables/utils/isVariable';
import { useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { AssociationFieldContext } from './context';

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
  const { action = 'list', service, fieldNames } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { getField } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const record = useRecord();
  const { parseFilter } = useParseDataScopeFilter();
  const [fieldServiceFilter, setFieldServiceFilter] = useState(null);
  const { form } = useFormBlockContext();

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

    reaction(() => {
      // 这一步主要是为了使 reaction 能够收集到依赖
      const flat = flatten(filterFromSchema, {
        breakOn({ key }) {
          return key.startsWith('$') && key !== '$and' && key !== '$or';
        },
        transformValue(value) {
          if (!isVariable(value)) {
            return value;
          }
          const result = _.get({ $nForm: form?.values }, getPath(value));
          return result;
        },
      });
      return flat;
    }, run);
  }, [
    field.componentProps?.service?.params?.filter,
    fieldSchema?.['x-component-props']?.service?.params?.filter,
    service?.params?.filter,
  ]);

  const normalizeValues = useCallback(
    (obj) => {
      if (obj && typeof obj === 'object') {
        return obj[fieldNames?.value];
      }
      return obj;
    },
    [fieldNames?.value],
  );

  const value = useMemo(() => {
    if (props.value === undefined || props.value === null) {
      return;
    }

    let result: any[] = null;

    if (Array.isArray(props.value)) {
      result = props.value.map(normalizeValues);
    } else {
      result = [normalizeValues(props.value)];
    }

    return result.filter(Boolean);
  }, [props.value, normalizeValues]);

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  }, [fieldSchema]);

  const sourceValue = record?.[collectionField?.sourceKey];
  const filter = useMemo(() => {
    const isOToAny = ['oho', 'o2m'].includes(collectionField?.interface);
    return mergeFilter(
      [
        mergeFilter([
          isOToAny && !isInFilterFormBlock(fieldSchema) && collectionField?.foreignKey
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
        collectionField?.foreignKey
          ? {
              [collectionField.foreignKey]: {
                $eq: sourceValue,
              },
            }
          : null,
        params?.filter && value?.length
          ? {
              [fieldNames?.value]: {
                ['$in']: value,
              },
            }
          : null,
      ],
      '$or',
    );
  }, [
    collectionField?.interface,
    collectionField.foreignKey,
    fieldSchema,
    fieldServiceFilter,
    sourceValue,
    params?.filter,
    value,
    fieldNames?.value,
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
