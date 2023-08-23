import { useTranslation } from 'react-i18next';
import { useFormActiveFields } from '../../../block-provider';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionName: string;
  collectionField: CollectionFieldOptions;
  schema?: any;
  noDisabled?: boolean;
}

/**
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useFormVariable = ({ collectionName, collectionField, schema, noDisabled }: Props) => {
  const { getActiveFieldsName } = useFormActiveFields();
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema: schema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName,
    noDisabled,
    returnFields: (fields, option) => {
      const activeFieldsName = getActiveFieldsName('form');

      return option.depth === 0
        ? fields.filter((field) => {
            return activeFieldsName.includes(field.name);
          })
        : fields;
    },
  });

  return result;
};
