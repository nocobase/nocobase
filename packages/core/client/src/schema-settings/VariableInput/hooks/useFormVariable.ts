import { Schema } from '@formily/json-schema';
import { useTranslation } from 'react-i18next';
import { CollectionFieldOptions } from '../../../collection-manager';
import { useBaseVariable } from './useBaseVariable';

interface Props {
  collectionName: string;
  collectionField: CollectionFieldOptions;
  schema?: any;
  noDisabled?: boolean;
  /** 消费变量值的字段 */
  targetFieldSchema?: Schema;
}

/**
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useFormVariable = ({ collectionName, collectionField, schema, noDisabled, targetFieldSchema }: Props) => {
  // const { getActiveFieldsName } = useFormActiveFields() || {};
  const { t } = useTranslation();
  const result = useBaseVariable({
    collectionField,
    uiSchema: schema,
    targetFieldSchema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName,
    noDisabled,
    returnFields: (fields, option) => {
      // fix https://nocobase.height.app/T-2277
      return fields;
      // const activeFieldsName = getActiveFieldsName?.('form') || [];

      // return option.depth === 0
      //   ? fields.filter((field) => {
      //       return activeFieldsName.includes(field.name);
      //     })
      //   : fields;
    },
  });

  return result;
};
