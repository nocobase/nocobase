/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useCollectionManager_deprecated, useCompile, Variable, useApp } from '@nocobase/client';

export const Expression = (props) => {
  const { value = '', useCurrentFields, onChange } = props;
  const app = useApp();
  const plugin = app.pm.get('field-formula') as any;
  const { expressionFields } = plugin;
  const compile = useCompile();
  const { interfaces } = useCollectionManager_deprecated();

  const fields = (useCurrentFields?.() ?? []).filter((field) => expressionFields.includes(field.interface));

  const options = fields.map((field) => ({
    label: compile(field.uiSchema.title),
    value: field.name,
    children: interfaces[field.interface].usePathOptions?.(field),
  }));

  return <Variable.TextArea value={value} onChange={onChange} scope={options} />;
};

export default Expression;
