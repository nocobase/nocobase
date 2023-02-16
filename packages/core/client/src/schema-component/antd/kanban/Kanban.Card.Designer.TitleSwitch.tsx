import React from 'react';
import { merge } from '@formily/shared';
import { SchemaInitializer } from '../../../schema-initializer';
import { useFieldSchema, Schema } from '@formily/react';
import { useDesignable } from '../../hooks';

export const KanbanCardDesignerTitleSwitch = (props) => {
  const { item } = props;
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();

  const enabled = fieldSchema['x-label-enabled'];

  const handleSwitch = () => {
    fieldSchema['x-label-enabled'] = !enabled;
    dn.emit('patch', {
      schema: fieldSchema,
    });
    dn.refresh();
  };

  return <SchemaInitializer.SwitchItem checked={enabled} title={item.title} onClick={handleSwitch} />;
};
