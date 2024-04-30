/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useCollectionManager_deprecated, useCompile, Variable } from '@nocobase/client';

export const Expression = (props) => {
  const { value = '', supports = [], useCurrentFields, onChange } = props;
  const compile = useCompile();
  const { interfaces } = useCollectionManager_deprecated();

  const fields = (useCurrentFields?.() ?? []).filter((field) => supports.includes(field.interface));

  const options = fields.map((field) => ({
    label: compile(field.uiSchema.title),
    value: field.name,
    children: interfaces[field.interface].usePathOptions?.(field),
  }));

  return <Variable.TextArea value={value} onChange={onChange} scope={options} />;
};

export default Expression;
