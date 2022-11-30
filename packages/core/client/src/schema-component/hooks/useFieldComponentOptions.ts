import { useFieldSchema } from "@formily/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useCollectionManager, useCollection } from "../../collection-manager";

export const useFieldComponentOptions = () => {
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const { t } = useTranslation();

  const fieldComponentOptions = useMemo(() => {
    if (!collectionField?.interface) return;
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
        ]

      default:
        return [
          { label: t('Record picker'), value: 'CollectionField' },
          { label: t('Subform'), value: 'FormField' },
          { label: t('Select'), value: 'AssociationSelect' },
        ];

    }
  }, [t, collectionField?.interface]);

  return fieldComponentOptions;
};
