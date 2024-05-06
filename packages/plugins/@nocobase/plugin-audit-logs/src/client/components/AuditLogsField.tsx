/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EllipsisWithTooltip, useCompile } from '@nocobase/client';
import React from 'react';
import { observer, useField } from '@formily/react';

export const AuditLogsField = observer(
  () => {
    const field = useField<any>();
    const compile = useCompile();
    if (!field.value) {
      return null;
    }
    return (
      <EllipsisWithTooltip ellipsis>
        {field.value?.uiSchema?.title ? compile(field.value?.uiSchema?.title) : field.value.name}
      </EllipsisWithTooltip>
    );
  },
  { displayName: 'AuditLogsField' },
);
