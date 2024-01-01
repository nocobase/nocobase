import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManagerV2, useCollectionV2 } from '../../application';

export const useFieldComponentOptions = () => {
  const cm = useCollectionManagerV2();
  const fieldSchema = useFieldSchema();
  const collection = useCollectionV2();
  const collectionField =
    collection.getField(fieldSchema['name']) || cm.getCollectionField(fieldSchema['x-collection-field']);
  const { t } = useTranslation();
  const { label } = fieldSchema['x-component-props']?.fieldNames || {};

  const fieldComponentOptions = useMemo(() => {
    if (!collectionField || !collectionField?.interface) {
      return;
    }

    if (!['o2o', 'oho', 'obo', 'o2m', 'linkTo', 'm2o', 'm2m'].includes(collectionField.interface)) return;

    const collection = cm.getCollection(collectionField.target);
    if (collection?.template === 'file') {
      return [
        { label: t('Record picker'), value: 'CollectionField' },
        { label: t('Select'), value: 'AssociationSelect' },
      ];
    }

    switch (collectionField.interface) {
      case 'o2m':
        return [
          { label: t('Record picker'), value: 'CollectionField' },
          { label: t('Subtable'), value: 'TableField' },
          { label: t('Select'), value: 'AssociationSelect' },
        ];

      case 'm2o':
      case 'm2m':
      case 'linkTo':
        return [
          { label: t('Record picker'), value: 'CollectionField' },
          { label: t('Select'), value: 'AssociationSelect' },
        ];

      default:
        return [
          { label: t('Record picker'), value: 'CollectionField' },
          { label: t('Subform'), value: 'FormField' },
          { label: t('Select'), value: 'AssociationSelect' },
        ];
    }
  }, [t, collectionField?.interface, label]);

  return fieldComponentOptions;
};
