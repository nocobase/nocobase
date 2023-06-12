import { useField, useFieldSchema } from '@formily/react';
import { useDesignable } from '@nocobase/client';
import _ from 'lodash';
import { useCallback } from 'react';

export const useSchemaPatch = () => {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const field = useField();

  const onUpdateComponentProps = useCallback((data) => {
    _.set(fieldSchema, 'x-component-props', data);
    field.componentProps = { ...field.componentProps, ...data };
    dn.emit('patch', {
      schema: {
        ['x-uid']: fieldSchema['x-uid'],
        'x-component-props': fieldSchema['x-component-props'],
      },
    });
    dn.refresh();
  }, []);

  return { onUpdateComponentProps };
};
