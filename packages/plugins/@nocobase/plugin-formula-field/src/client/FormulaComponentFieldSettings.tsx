import { useFieldSchema } from '@formily/react';
import { SchemaSettings, SchemaSettingsNumberFormat, useColumnSchema, useIsFieldReadPretty } from '@nocobase/client';

export const FormulaComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Formula.Result',
  items: [
    {
      name: 'displayFormat',
      Component: SchemaSettingsNumberFormat as any,
      useComponentProps() {
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        return {
          fieldSchema,
        };
      },
      useVisible() {
        const isFieldReadPretty = useIsFieldReadPretty();
        return isFieldReadPretty;
      },
    },
  ],
});
