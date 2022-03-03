import { useField } from '@formily/react';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../';

export const TabsDesigner = () => {
  const field = useField();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Popup
        schema={{
          type: 'void',
          'x-component': 'Action.Modal',
          'x-decorator': 'Form',
          'x-component-props': {
            title: '标题',
          },
        }}
      >
        编辑
      </SchemaSettings.Popup>
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
