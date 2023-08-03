import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

export const useIterationVariable = ({
  blockForm,
  currentCollection,
  schema,
  rootCollection,
}: {
  blockForm?: any;
  currentCollection: string;
  rootCollection: string;
  schema?: any;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    schema,
    maxDepth: 4,
    name: '$iteration',
    title: t('Current object'),
    collectionName: currentCollection,
    returnFields: (fields, option) => {
      return option.depth === 0
        ? fields.filter((field) => {
            return Object.keys(blockForm.fields).some((name) => name.includes(`.${field.name}`));
          })
        : fields;
    },
  });

  return blockForm && currentCollection !== rootCollection ? result : null;
};
