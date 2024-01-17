import { Field } from '@formily/core';
import { useField } from '@formily/react';
import { useIsFileField } from '../../../schema-component';
import { useColumnSchema } from '../../../schema-component/antd/table-v2/Table.Column.Decorator';

export function useFieldComponentName(): string {
  const { fieldSchema, collectionField } = useColumnSchema();
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const map = {
    // AssociationField 的 mode 默认值是 Select
    AssociationField: 'Select',
  };
  const fieldComponentName =
    field?.componentProps?.['mode'] ||
    (isFileField ? 'FileManager' : '') ||
    collectionField?.uiSchema?.['x-component'] ||
    fieldSchema?.['x-component'];
  return map[fieldComponentName] || fieldComponentName;
}
