import { useField } from '@formily/react';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../';

export const MenuDesigner = () => {
  const field = useField();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Item>编辑</SchemaSettings.Item>
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
