import { useFieldSchema } from '@formily/react';
import { SchemaSettings, SchemaSettingsNumberFormat, useColumnSchema, useIsFieldReadPretty } from '@nocobase/client';
import { useTargetCollectionField } from './components/Formula/Result';
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
        const schema = useFieldSchema();
        const { fieldSchema: tableColumnSchema } = useColumnSchema();
        const fieldSchema = tableColumnSchema || schema;
        const { dataType } = useTargetCollectionField(fieldSchema) || {};
        const isNumberFormat = ['integer', 'bigInt', 'double', 'decimal'].includes(dataType);
        const isFieldReadPretty = useIsFieldReadPretty();
        return isFieldReadPretty && isNumberFormat;
      },
    },
  ],
});
