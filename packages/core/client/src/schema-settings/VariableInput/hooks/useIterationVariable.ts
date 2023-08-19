import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockRequestContext } from '../../../block-provider';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前对象`
 * @param param0
 * @returns
 */
export const useIterationVariable = ({ currentCollection, schema }: { currentCollection: string; schema?: any }) => {
  const ctx = useContext(BlockRequestContext);
  const { t } = useTranslation();
  const result = useBaseVariable({
    uiSchema: schema,
    maxDepth: 4,
    name: '$iteration',
    title: t('Current object'),
    collectionName: currentCollection,
    returnFields: (fields, option) => {
      return option.depth === 0
        ? fields.filter((field) => {
            if (ctx.field?.data?.activeFields) {
              return ctx.field.data.activeFields.has(field.name);
            }
          })
        : fields;
    },
  });

  return result;
};
