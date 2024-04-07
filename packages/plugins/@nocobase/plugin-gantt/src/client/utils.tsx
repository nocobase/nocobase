import { useCollection_deprecated, useCompile } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const useGanttTranslation = () => {
  return useTranslation('gantt');
};
export const useOptions = (type = 'string') => {
  const compile = useCompile();
  const { fields } = useCollection_deprecated();
  const options = fields
    ?.filter((field) => field.type === type)
    ?.map((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title),
      };
    });
  return options;
};
