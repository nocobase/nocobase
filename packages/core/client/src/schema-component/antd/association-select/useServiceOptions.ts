import { useFieldSchema } from '@formily/react';
import { useCallback, useMemo } from 'react';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { isInFilterFormBlock } from '../../../filter-provider';
import { mergeFilter } from '../../../filter-provider/utils';
import { useRecord } from '../../../record-provider';

export default function useServiceOptions(props) {
  const { action = 'list', service, fieldNames } = props;
  const params = service?.params || {};
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const { getCollectionFields } = useCollectionManager_deprecated();
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
    return getField(fieldSchema.name);
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
  }, [params?.filter, getCollectionFields, collectionField, sourceValue, value, fieldNames.value]);

  return useMemo(() => {
    return {
      resource: collectionField?.target,
      action,
      ...service,
      params: { ...service?.params, filter },
    };
  }, [collectionField?.target, action, filter, service]);
}
