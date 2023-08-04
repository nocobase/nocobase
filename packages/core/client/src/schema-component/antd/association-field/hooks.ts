import { GeneralField } from '@formily/core';
import { useField, useFieldSchema, useForm } from '@formily/react';
import flat from 'flat';
import { isString } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import { useCallback, useContext, useMemo } from 'react';
import { useBlockRequestContext } from '../../../block-provider/BlockProvider';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { isInFilterFormBlock } from '../../../filter-provider';
import { useRecord } from '../../../record-provider';
import { getInnermostKeyAndValue } from '../../common/utils/uitls';
import { useDesignable } from '../../hooks';
import { AssociationFieldContext } from './context';
import { extractFilterfield, extractValuesByPattern, generatePattern, parseVariables } from './util';

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
  const form = useForm();
  const ctx = useBlockRequestContext();
  const { getField } = useCollection();
  const { getCollectionFields, getCollectionJoinField } = useCollectionManager();
  const record = useRecord();
  const parseFilter = useCallback(
    (rules) => {
      if (!rules) {
        return undefined;
      }
      if (typeof rules === 'string') {
        return rules;
      }
      const type = Object.keys(rules)[0] || '$and';
      const conditions = rules[type];
      const results = [];
      conditions?.forEach((c) => {
        const jsonlogic = getInnermostKeyAndValue(c);
        const regex = /{{(.*?)}}/;
        const matches = jsonlogic.value?.match?.(regex);
        if (!matches || (!matches[1].includes('$form') && !matches[1].includes('$iteration'))) {
          results.push(c);
          return;
        }
        const associationfield = extractFilterfield(matches[1]);
        const filterCollectionField = getCollectionJoinField(`${ctx.props.collection}.${associationfield}`);
        if (['o2m', 'm2m'].includes(filterCollectionField?.interface)) {
          // 对多子表单
          const pattern = generatePattern(matches?.[1], associationfield);
          const parseValue: any = extractValuesByPattern(flat(form.values), pattern);
          const filters = parseValue.map((v) => {
            return JSON.parse(JSON.stringify(c).replace(jsonlogic.value, v));
          });
          results.push({ $or: filters });
        } else {
          const variablesCtx = { $form: form.values, $iteration: form.values };
          let str = matches?.[1];
          if (str.includes('$iteration')) {
            const path = field.path.segments.concat([]);
            path.pop();
            str = str.replace('$iteration.', `$iteration.${path.join('.')}.`);
          }
          const parseValue = parseVariables(str, variablesCtx);
          if (Array.isArray(parseValue)) {
            const filters = parseValue.map((v) => {
              return JSON.parse(JSON.stringify(c).replace(jsonlogic.value, v));
            });
            results.push({ $or: filters });
          } else {
            const filterObj = JSON.parse(
              JSON.stringify(c).replace(jsonlogic.value, str.endsWith('id') ? parseValue ?? 0 : parseValue),
            );
            results.push(filterObj);
          }
        }
      });
      return { [type]: results };
    },
    [ctx.props?.collection, field.path.segments, form.values, getCollectionJoinField],
  );

  const fieldServiceFilter = useMemo(() => {
    const filterFromSchema = isString(fieldSchema?.['x-component-props']?.service?.params?.filter)
      ? field.componentProps?.service?.params?.filter
      : fieldSchema?.['x-component-props']?.service?.params?.filter;

    return mergeFilter([parseFilter(filterFromSchema) || service?.params?.filter]);
  }, [field.componentProps?.service?.params?.filter, fieldSchema, parseFilter, service?.params?.filter]);

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
    if (Array.isArray(props.value)) {
      return props.value.map(normalizeValues);
    } else {
      return [normalizeValues(props.value)];
    }
  }, [props.value, normalizeValues]);

  const collectionField = useMemo(() => {
    return getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  }, [fieldSchema.name]);

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
        params?.filter && value
          ? {
              [fieldNames?.value]: {
                ['$in']: value,
              },
            }
          : null,
      ],
      '$or',
    );
  }, [params?.filter, getCollectionFields, collectionField, sourceValue, value, fieldNames?.value]);

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
