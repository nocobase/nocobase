import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useIsFileField } from '../../../../schema-component';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';

export function useFieldComponentName(): string {
  const { fieldSchema: tableColumnSchema, collectionField } = useColumnSchema();
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const schema = useFieldSchema();
  const fieldSchema = tableColumnSchema || schema;
  const map = {
    // AssociationField 的 mode 默认值是 Select
    AssociationField: 'Select',
  };
  const fieldComponentName =
    fieldSchema?.['x-component-props']?.['mode'] ||
    field?.componentProps?.['mode'] ||
    (isFileField ? 'FileManager' : '') ||
    collectionField?.uiSchema?.['x-component'];
  return map[fieldComponentName] || fieldComponentName;
}
