import { useFieldSchema } from '@formily/react';
import { useCallback, useMemo } from 'react';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { isInFilterFormBlock } from '../../../filter-provider';
import { useRecord } from '../../../record-provider';
import { useCollectionManagerV2, useCollectionV2 } from '../../../application';

export default function useServiceOptions(props) {
  const { action = 'list', service, fieldNames } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const collection = useCollectionV2();
  const cm = useCollectionManagerV2();
  const record = useRecord();

  const normalizeValues = useCallback(
    (obj) => {
      if (obj && typeof obj === 'object') {
        return obj[fieldNames.value];
      }
      return obj;
    },
    [fieldNames.value],
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
    return collection.getField(fieldSchema.name);
  }, [collection, fieldSchema.name]);

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
          params?.filter,
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
              [fieldNames.value]: {
                ['$in']: value,
              },
            }
          : null,
      ],
      '$or',
    );
  }, [params?.filter, cm.getCollectionFields, collectionField, sourceValue, value, fieldNames.value]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}
