import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockRequestContext } from '../../../block-provider';
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
  const ctx = useContext(BlockRequestContext);
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
      return option.depth === 0
        ? fields.filter((field) => {
            if (ctx.field?.data?.activeFields) {
              return ctx.field.data.activeFields.has(field.name);
            }
            return false;
          })
        : fields;
    },
  });

  return result;
};
