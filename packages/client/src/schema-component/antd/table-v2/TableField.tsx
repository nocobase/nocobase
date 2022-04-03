import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect } from 'react';
import { useCollection } from '../../../collection-manager';
import { ActionBar } from '../action';

export const TableField: any = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const field = useField();
  const collectionField = getField(fieldSchema.name);
  useEffect(() => {
    if (!field.title) {
      field.title = collectionField?.uiSchema?.title;
    }
  }, []);
  return <div>{props.children}</div>;
});

TableField.ActionBar = observer((props) => {
  const form = useForm();
  if (form.readPretty) {
    return null;
  }
  return <div style={{ marginBottom: 8, marginTop: -32 }}><ActionBar {...props} /></div>;
});
