import { Form } from '@formily/core';
import { useTranslation } from 'react-i18next';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`当前表单`
 * @param param0
 * @returns
 */
export const useFormVariable = ({
  collectionName,
  schema,
  form,
}: {
  collectionName: string;
  schema?: any;
  form: Form;
}) => {
  const { t } = useTranslation();
  const result = useBaseVariable({
    schema,
    maxDepth: 4,
    name: '$nForm',
    title: t('Current form'),
    collectionName: collectionName,
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
