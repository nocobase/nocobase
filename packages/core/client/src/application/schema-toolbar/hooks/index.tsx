import React, { useMemo } from 'react';
import { ISchema } from '@formily/json-schema';
import { useComponent, useDesignable } from '../../../schema-component';
import { SchemaToolbar, SchemaToolbarProps } from '../../../schema-settings';

export const useSchemaToolbarRender = (fieldSchema: ISchema) => {
  const { designable } = useDesignable();
  const toolbar = useMemo(() => {
    if (fieldSchema['x-designer'] || fieldSchema['x-toolbar']) {
      return fieldSchema['x-toolbar'];
    }

    if (fieldSchema['x-settings']) {
      return SchemaToolbar;
    }
  }, [fieldSchema]);

  const C = useComponent(toolbar);
  return {
    render(props?: SchemaToolbarProps) {
      if (!designable || !C) {
        return null;
      }
      return <C {...fieldSchema['x-toolbar-props']} {...props} />;
    },
    exists: !!C,
  };
};
