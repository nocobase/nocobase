/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect } from 'react';
import { Card, Tooltip } from 'antd';
import { onFieldChange } from '@formily/core';
import { useField, useFormEffects } from '@formily/react';

import { SchemaComponent, SchemaComponentContext, useApp, usePlugin, useRecord } from '@nocobase/client';

import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import OpenDrawer from './components/OpenDrawer';
import { workflowSchema } from './schemas/workflows';
import { ExecutionStatusSelect, ExecutionStatusColumn } from './components/ExecutionStatus';
import WorkflowPlugin, { RadioWithTooltip } from '.';
import { useRefreshActionProps } from './hooks/useRefreshActionProps';

function SyncOptionSelect(props) {
  const field = useField<any>();
  const record = useRecord();
  const workflowPlugin = usePlugin(WorkflowPlugin);

  useFormEffects((form) => {
    onFieldChange('type', (f: any) => {
      let disabled = record.id || !f.value;
      if (f.value) {
        const trigger = workflowPlugin.triggers.get(f.value);
        if (trigger.sync != null) {
          disabled = true;
          field.setValue(trigger.sync);
        } else {
          field.setInitialValue(false);
        }
      }
      field.setPattern(disabled ? 'disabled' : 'editable');
    });
  });

  useEffect(() => {
    if (record.id) {
      field.setPattern('disabled');
      const trigger = workflowPlugin.triggers.get(record.type);
      if (trigger.sync != null) {
        field.setValue(trigger.sync);
      } else {
        field.setInitialValue(false);
      }
    }
  }, [record.id, field, workflowPlugin.triggers]);

  return <RadioWithTooltip {...props} />;
}

function useWorkflowSyncAction(field) {
  const app = useApp();
  field.visible = Boolean(usePlugin('multi-app-share-collection') || app.name !== 'main');
}

export function WorkflowPane() {
  const ctx = useContext(SchemaComponentContext);
  const { useTriggersOptions } = usePlugin(WorkflowPlugin);
  return (
    <Card bordered={false}>
      <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
        <SchemaComponent
          schema={workflowSchema}
          components={{
            WorkflowLink,
            ExecutionResourceProvider,
            ExecutionLink,
            OpenDrawer,
            ExecutionStatusSelect,
            SyncOptionSelect,
            ExecutionStatusColumn,
            Tooltip,
          }}
          scope={{
            useTriggersOptions,
            useWorkflowSyncAction,
            useRefreshActionProps,
          }}
        />
      </SchemaComponentContext.Provider>
    </Card>
  );
}
