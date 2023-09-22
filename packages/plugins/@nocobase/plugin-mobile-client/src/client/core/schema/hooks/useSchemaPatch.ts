import { useField, useFieldSchema } from '@formily/react';
import { useDesignable } from '@nocobase/client';
import lodash from 'lodash';
import { useMemoizedFn } from 'ahooks';

export const useSchemaPatch = () => {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const field = useField();

  const onUpdateComponentProps = useMemoizedFn(async (data) => {
    lodash.set(fieldSchema, 'x-component-props', data);
    field.componentProps = { ...field.componentProps, ...data };
    await dn.emit('patch', {
      schema: {
        ['x-uid']: fieldSchema['x-uid'],
        'x-component-props': fieldSchema['x-component-props'],
        'x-server-hooks': [
          {
            type: 'onSelfSave',
            method: 'extractTextToLocale',
          },
        ],
      },
    });
    await dn.refresh();
  });

  return { onUpdateComponentProps };
};
