import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useIsFileField } from '../schema-component/antd/form-item/FormItem.Settings';
import { useColumnSchema } from '../schema-component/antd/table-v2/Table.Column.Decorator';
import { useCollectionField } from '../data-source';

export function useFieldComponentName(): string {
  const { fieldSchema: tableColumnSchema, collectionField: tableColumnField } = useColumnSchema();
  const field = useField<Field>();
  const isFileField = useIsFileField();
  const schema = useFieldSchema();
  const targetCollectionField = useCollectionField();
  const fieldSchema = tableColumnSchema || schema;
  const collectionField = tableColumnField || targetCollectionField;

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
