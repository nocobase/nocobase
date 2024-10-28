/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useEffect } from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { useCompile } from '../../hooks';

export const FormField: any = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const { getField } = useCollection_deprecated();
    const field = useField();
    const collectionField = getField(fieldSchema.name);
    const compile = useCompile();
    useEffect(() => {
      if (!field.title) {
        field.title = compile(collectionField?.uiSchema?.title);
      }
    }, []);
    return <div>{props.children}</div>;
  },
  { displayName: 'FormField' },
);
