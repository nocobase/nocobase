import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

export const useFormVariable = ({
  blockForm,
  rootCollection,
  schema,
}: {
  blockForm?: any;
  rootCollection: string;
  schema?: any;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    schema,
    maxDepth: 4,
    name: '$form',
    title: t('Current form'),
    collectionName: rootCollection,
    returnFields: (fields, option) => {
      return option.depth === 0
        ? fields.filter((field) => {
            return Object.keys(blockForm.fields).some((name) => name.includes(`.${field.name}`));
          })
        : fields;
    },
  });

  return blockForm ? result : null;
};
