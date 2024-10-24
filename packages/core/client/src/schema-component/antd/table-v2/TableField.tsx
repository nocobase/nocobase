/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React, { useEffect } from 'react';
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
    useEffect(() => {
      if (!field.title) {
        field.title = compile(collectionField?.uiSchema?.title);
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
