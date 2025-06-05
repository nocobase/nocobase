/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { defaultFieldNames, useCompile } from '@nocobase/client';

export function EnumerationField(props) {
  const { value, multiple, fieldNames = defaultFieldNames } = props;
  const compile = useCompile();
  const items = multiple ? value ?? [] : value ? [value] : [];
  return items.map((item) => {
    return (
      <Tag key={item[fieldNames.value]} color={item[fieldNames.color]}>
        {compile(item[fieldNames.label])}
      </Tag>
    );
  });
}
