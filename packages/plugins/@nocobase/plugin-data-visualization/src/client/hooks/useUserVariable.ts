import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { useCollectionFieldsOptions } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';

export const useUserVariable = ({ schema }: { schema: any }) => {
  const { t: trans } = useTranslation();
  const t = useMemoizedFn(trans);
  const options = useCollectionFieldsOptions('users');
  const component = schema?.['x-component'];
  const getOptions = useCallback(
    (options: any) =>
      options.map((option: any) => {
        const result = {
          key: option.name,
          value: option.name,
          // disabled: !option.children && component !== option.schema?.['x-component'],
          label: Schema.compile(option.title, { t }),
        };
        if (option.children) {
          result['children'] = getOptions(option.children);
        }
        return result;
      }),
    [t],
  );
  const children = useMemo(() => getOptions(options), [getOptions, options]);
  const result = useMemo(
    () => ({
      label: t('Current user'),
      value: '$user',
      key: '$user',
      children,
    }),
    [children, t],
  );

  return result;
};
