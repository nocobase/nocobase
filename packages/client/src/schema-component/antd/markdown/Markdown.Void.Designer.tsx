import { useField } from '@formily/react';
import React from 'react';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const MarkdownVoidDesigner = () => {
  const field = useField();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Item
        title={'编辑'}
        onClick={() => {
          field.editable = true;
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};
