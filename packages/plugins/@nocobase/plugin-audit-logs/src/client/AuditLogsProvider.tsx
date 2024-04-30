/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { AuditLogsBlockInitializer } from './AuditLogsBlockInitializer';
import { AuditLogsBlockProvider } from './AuditLogsBlockProvider';
import { AuditLogsField } from './components/AuditLogsField';
import { AuditLogsValue } from './components/AuditLogsValue';
import { AuditLogsViewActionInitializer } from './components/AuditLogsViewActionInitializer';
import { AuditLogs } from './deplicated/AuditLogs';
import { AuditLogsTableActionColumnInitializer } from './initializers/AuditLogsTableActionColumnInitializer';

export const AuditLogsProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{
        AuditLogs,
        AuditLogsBlockProvider,
        AuditLogsBlockInitializer,
        AuditLogsValue,
        AuditLogsField,
        AuditLogsViewActionInitializer,
        AuditLogsTableActionColumnInitializer,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
