import { SchemaComponent, SchemaComponentContext, usePlugin, useRecord } from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext, useEffect } from 'react';
import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import OpenDrawer from './components/OpenDrawer';
import { workflowSchema } from './schemas/workflows';
import { ExecutionStatusSelect, ExecutionStatusColumn } from './components/ExecutionStatus';
import WorkflowPlugin, { RadioWithTooltip } from '.';
import { onFieldChange } from '@formily/core';
import { useField, useFormEffects } from '@formily/react';

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

export function WorkflowPane() {
  const ctx = useContext(SchemaComponentContext);
  const { getTriggersOptions } = usePlugin(WorkflowPlugin);
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
          }}
          scope={{
            getTriggersOptions,
          }}
        />
      </SchemaComponentContext.Provider>
    </Card>
  );
}
