import { useTranslation } from 'react-i18next';
import { useFormActiveFields } from '../../../block-provider';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前对象`
 * @param param0
 * @returns
 */
export const useIterationVariable = ({
  currentCollection,
  collectionField,
  schema,
  noDisabled,
}: {
  currentCollection: string;
  collectionField: CollectionFieldOptions;
  schema?: any;
  noDisabled?: boolean;
}) => {
  const { getActiveFieldsName } = useFormActiveFields();
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema: schema,
    maxDepth: 4,
    name: '$iteration',
    title: t('Current object'),
    collectionName: currentCollection,
    noDisabled,
    returnFields: (fields, option) => {
      const activeFieldsName = getActiveFieldsName('nester');

      return option.depth === 0
        ? fields.filter((field) => {
            return activeFieldsName.includes(field.name);
          })
        : fields;
    },
  });

  return result;
};
