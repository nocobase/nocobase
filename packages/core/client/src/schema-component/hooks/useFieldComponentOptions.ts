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
    const specialComponents = {
      m2o: [
        { label: t('Record picker'), value: 'CollectionField' },
        { label: t('Select'), value: 'AssociationSelect' },
      ],
      o2m: [
        { label: t('Record picker'), value: 'CollectionField' },
        { label: t('Subtable'), value: 'TableField' },
        { label: t('Select'), value: 'AssociationSelect' },
      ],
    };
    return (
      specialComponents[collectionField.interface] ?? [
        { label: t('Record picker'), value: 'CollectionField' },
        { label: t('Subform'), value: 'FormField' },
        { label: t('Select'), value: 'AssociationSelect' },
      ]
    );
  }, [t, collectionField?.interface]);

  return fieldComponentOptions;
};
