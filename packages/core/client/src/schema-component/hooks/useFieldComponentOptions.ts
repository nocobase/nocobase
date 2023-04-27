import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../collection-manager';

export const useFieldComponentOptions = () => {
  const { getCollectionJoinField, getCollection } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const { t } = useTranslation();
  const { label } = fieldSchema['x-component-props']?.fieldNames || {};

  const fieldComponentOptions = useMemo(() => {
    if (!collectionField || !collectionField?.interface) {
      return;
    }

    if (!['o2o', 'oho', 'obo', 'o2m', 'linkTo', 'm2o', 'm2m'].includes(collectionField.interface)) return;

    const collection = getCollection(collectionField.target);
    if (collection?.template === 'file') {
      return [
        { label: t('Record picker'), value: 'CollectionField' },
        { label: t('Select'), value: 'AssociationSelect' },
      ];
    }

    switch (collectionField.interface) {
      case 'o2m':
        return [
          { label: t('Record picker'), value: 'RecordPicker' },
          { label: t('Subtable'), value: 'SubTable' },
          { label: t('Select'), value: 'AssociationSelect' },
          { label: t('Subform'), value: 'SubForm' },
        ];

      case 'm2o':
      case 'm2m':
      case 'linkTo':
        return [
          { label: t('Record picker'), value: 'RecordPicker' },
          { label: t('Select'), value: 'AssociationSelect' },
          { label: t('Subform'), value: 'SubForm' },
        ];

      default:
        return [
          { label: t('Record picker'), value: 'RecordPicker' },
          { label: t('Select'), value: 'AssociationSelect' },
          { label: t('Subform'), value: 'SubForm' },
        ];
    }
  }, [t, collectionField?.interface, label]);

  return fieldComponentOptions;
};
