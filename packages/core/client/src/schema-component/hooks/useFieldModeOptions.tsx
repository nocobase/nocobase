import { useFieldSchema, useField } from '@formily/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../collection-manager';

export const useFieldModeOptions = () => {
  const { getCollectionJoinField, getCollection } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const field = useField();
  const isReadPretty = field.readPretty;
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const { t } = useTranslation();
  const { label } = fieldSchema['x-component-props']?.fieldNames || {};
  const fieldModeOptions = useMemo(() => {
    if (!collectionField || !collectionField?.interface) {
      return;
    }

    if (!['o2o', 'oho', 'obo', 'o2m', 'linkTo', 'm2o', 'm2m'].includes(collectionField.interface)) return;
    const collection = getCollection(collectionField.target);
    if (collection?.template === 'file') {
      return isReadPretty?[
        { label: t('Title'), value: 'Select' },
        { label: t('File manager'), value: 'FileManager' },
      ]:[
        { label: t('File manager'), value: 'FileManager' },
        { label: t('Record picker'), value: 'Picker' },
        { label: t('Select'), value: 'Select' },
      ];
    }

    switch (collectionField.interface) {
      case 'o2m':
        return isReadPretty
          ? [
              { label: t('Title'), value: 'Select' },
              // { label: t('Subtable'), value: 'SubTable' },
              { label: t('Sub-details'), value: 'Nester' },
            ]
          : [
              { label: t('Record picker'), value: 'Picker' },
              // { label: t('Subtable'), value: 'SubTable' },
              { label: t('Select'), value: 'Select' },
              { label: t('Subform'), value: 'Nester' },
            ];

      case 'm2o':
      case 'm2m':
      case 'linkTo':
        return isReadPretty
          ? [
              { label: t('Title'), value: 'Select' },
              { label: t('Sub-details'), value: 'Nester' },
            ]
          : [
              { label: t('Record picker'), value: 'Picker' },
              { label: t('Select'), value: 'Select' },
              { label: t('Subform'), value: 'Nester' },
            ];

      default:
        return isReadPretty
          ? [
              { label: t('Title'), value: 'Select' },
              { label: t('Sub-details'), value: 'Nester' },
            ]
          : [
              { label: t('Record picker'), value: 'Picker' },
              { label: t('Select'), value: 'Select' },
              { label: t('Subform'), value: 'Nester' },
            ];
    }
  }, [t, collectionField?.interface, label]);
  return fieldModeOptions;
};
