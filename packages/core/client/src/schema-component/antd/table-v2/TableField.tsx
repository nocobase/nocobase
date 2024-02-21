import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect } from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection_deprecated } from '../../../collection-manager';
import { useCompile } from '../../hooks';
import { ActionBar } from '../action';

export const TableField: any = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const { getField } = useCollection_deprecated();
    const field = useField<Field>();
    const collectionField = getField(fieldSchema.name);
    const compile = useCompile();
    const ctx = useFormBlockContext();
    useEffect(() => {
      if (!field.title) {
        field.title = compile(collectionField?.uiSchema?.title);
      }
      if (ctx?.field) {
        ctx.field.added = ctx.field.added || new Set();
        ctx.field.added.add(fieldSchema.name);
      }
    }, []);
    useEffect(() => {
      field.decoratorProps.asterisk = fieldSchema.required;
    }, [fieldSchema.required]);
    return <div>{props.children}</div>;
  },
  { displayName: 'TableField' },
);

TableField.ActionBar = observer(
  (props) => {
    const form = useForm();
    if (form.readPretty) {
      return null;
    }
    return (
      <div style={{ marginBottom: 8, marginTop: -32 }}>
        <ActionBar {...props} />
      </div>
    );
  },
  { displayName: 'TableField.ActionBar' },
);
