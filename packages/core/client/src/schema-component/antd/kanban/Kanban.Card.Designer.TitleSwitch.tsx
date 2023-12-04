import React from 'react';
import { useFieldSchema, Schema } from '@formily/react';
import { useDesignable } from '../../hooks';
import { SchemaInitializerSwitch, useSchemaInitializerItem } from '../../../application';

export const KanbanCardDesignerTitleSwitch = () => {
  const itemConfig = useSchemaInitializerItem();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();

  const disabled = fieldSchema['x-label-disabled'];

  const handleSwitch = () => {
    fieldSchema['x-label-disabled'] = !disabled;
    dn.emit('patch', {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-label-disabled': fieldSchema['x-label-disabled'],
      },
    });
    dn.refresh();
  };

  return <SchemaInitializerSwitch checked={!disabled} title={itemConfig.title} onClick={handleSwitch} />;
};
