import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { DragHandler, useDesignable } from '../schema-component';
import { SchemaSettings } from './SchemaSettings';

export const GeneralSchemaDesigner = (props: any) => {
  const { dn } = useDesignable();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  return (
    <div>
      <SchemaSettings title={'配置'} {...schemaSettingsProps}>
        {props.children}
      </SchemaSettings>
      <DragHandler />
    </div>
  );
};
