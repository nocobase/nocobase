import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect } from 'react';
import { uid } from '@formily/shared';
import { onFormInputChange } from '@formily/core';
import { useFormBlockContext } from '../../../block-provider';
import { useActionContext } from '..';
import { useCollection } from '../../../collection-manager';
import { useCompile } from '../../hooks';

export const SubForm: any = observer((props: any) => {
  const form = useForm();
  console.log(form);
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const field = useField();
  const collectionField = getField(fieldSchema.name);
  const compile = useCompile();
  const ctx = useFormBlockContext();
  const { setFormValueChanged } = useActionContext();
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      onFormInputChange((form) => {
        console.log(form)
        setFormValueChanged?.(true);
      });
    });
    if (props.disabled) {
      form.disabled = props.disabled;
    }
    return () => {
      form.removeEffects(id);
    };
  }, []);
  useEffect(() => {
    if (!field.title) {
      field.title = compile(collectionField?.uiSchema?.title);
    }
    if (ctx?.field) {
      ctx.field.added = ctx.field.added || new Set();
      ctx.field.added.add(fieldSchema.name);
    }
  }, []);
  return <div>{props.children}</div>;
});
