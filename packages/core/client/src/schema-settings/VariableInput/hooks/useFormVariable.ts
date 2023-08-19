import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockRequestContext } from '../../../block-provider';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useFormVariable = ({ collectionName, schema }: { collectionName: string; schema?: any }) => {
  const ctx = useContext(BlockRequestContext);
  const { t } = useTranslation();
  const result = useBaseVariable({
    uiSchema: schema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName,
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
