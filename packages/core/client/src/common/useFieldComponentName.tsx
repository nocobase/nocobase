import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import { useCollectionField } from '../modules/form-creation/schema-settings/fieldComponents/utils';
import { useIsFileField } from '../schema-component/antd/form-item/FormItem.Settings';

export function useFieldComponentName(): string {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const collectionField = useCollectionField();
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
