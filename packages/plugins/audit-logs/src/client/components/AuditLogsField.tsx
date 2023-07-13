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
