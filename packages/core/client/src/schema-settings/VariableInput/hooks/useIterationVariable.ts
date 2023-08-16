import { Form } from '@formily/core';
import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前对象`
 * @param param0
 * @returns
 */
export const useIterationVariable = ({
  currentCollection,
  schema,
  form,
}: {
  form: Form;
  currentCollection: string;
  schema?: any;
}) => {
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
            return Object.keys(form.fields).some((name) => name.includes(`.${field.name}`));
          })
        : fields;
    },
  });

  return result;
};
