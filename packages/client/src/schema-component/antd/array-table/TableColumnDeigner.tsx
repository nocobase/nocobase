import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useDesignable } from '../../hooks';

export const TableColumnDeigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Item
        title={'编辑'}
        onClick={() => {
          field.title = uid();
          fieldSchema.title = uid();
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              title: fieldSchema.title,
            },
          });
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
