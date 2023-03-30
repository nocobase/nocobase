import React from 'react';
import { merge } from '@formily/shared';
import { SchemaInitializer } from '../../../schema-initializer';
import { useFieldSchema, Schema } from '@formily/react';
import { useDesignable } from '../../hooks';

export const KanbanCardDesignerTitleSwitch = (props) => {
  const { item } = props;
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

  return <SchemaInitializer.SwitchItem checked={!disabled} title={item.title} onClick={handleSwitch} />;
};
