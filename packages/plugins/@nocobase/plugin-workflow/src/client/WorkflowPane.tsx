/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect } from 'react';
import { App, Tooltip } from 'antd';
import { onFieldChange } from '@formily/core';
import { useField, useForm, useFormEffects } from '@formily/react';

import {
  CollectionProvider,
  SchemaComponent,
  SchemaComponentContext,
  useActionContext,
  useAPIClient,
  useApp,
  useCancelAction,
  useCollectionRecordData,
  useDataBlock,
  useDataBlockRequest,
  usePlugin,
  useRecord,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';

import { ExecutionLink } from './ExecutionLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import OpenDrawer from './components/OpenDrawer';
import { workflowSchema } from './schemas/workflows';
import { ExecutionStatusSelect, ExecutionStatusColumn } from './components/ExecutionStatus';
import WorkflowPlugin, { ExecutionStatusOptions, RadioWithTooltip } from '.';
import { useTranslation } from 'react-i18next';
import { TriggerOptionRender } from './components/TriggerOptionRender';
import { CategoryTabs } from './WorkflowCategoryTabs';
import { EnumerationField } from './components/EmunerationField';

function useCreateAction(actionCallback?: (values: any) => void) {
  const form = useForm();
  const field = useField();
  const ctx = useActionContext();
  const { refresh } = useDataBlockRequest();
  const api = useAPIClient();
  return {
    async run() {
      try {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        const res = await api.resource('workflows').create({ values: form.values });
        ctx.setVisible(false);
        actionCallback?.(res?.data?.data);
        await form.reset();
        field.data.loading = false;
        refresh();
      } catch (error) {
        console.error(error);
      } finally {
        if (field.data) {
          field.data.loading = false;
        }
      }
    },
  };
}

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
        field.setInitialValue(props.value ?? false);
      }
    }
  }, [record.id, field, workflowPlugin.triggers, record.type, props.value]);
  return <RadioWithTooltip {...props} />;
}

function useWorkflowSyncReaction(field) {
  const app = useApp();
  field.visible = Boolean(usePlugin('multi-app-share-collection') || app.name !== 'main');
}

function useSyncAction() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { resource } = useResourceContext();
  return {
    async run() {
      await resource.sync();
      message.success(t('Operation succeeded'));
    },
  };
}

function useRevisionAction() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { refresh } = useDataBlockRequest();
  const api = useAPIClient();
  const { id } = useCollectionRecordData();
  const { setVisible } = useActionContext();
  const form = useForm();
  const field = useField();

  return {
    async run() {
      try {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        await api.resource('workflows').revision({ filterByTk: id, values: form.values });
        message.success(t('Operation succeeded'));
        refresh();
        setVisible(false);
      } catch (error) {
        console.error(error);
      } finally {
        if (field.data) {
          field.data.loading = false;
        }
      }
    },
  };
}

export function WorkflowPane() {
  const ctx = useContext(SchemaComponentContext);
  const { useTriggersOptions } = usePlugin(WorkflowPlugin);
  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
      <SchemaComponent
        schema={workflowSchema}
        components={{
          CollectionProvider,
          WorkflowLink,
          ExecutionResourceProvider,
          ExecutionLink,
          OpenDrawer,
          ExecutionStatusSelect,
          SyncOptionSelect,
          ExecutionStatusColumn,
          Tooltip,
          CategoryTabs,
          EnumerationField,
        }}
        scope={{
          useCancelAction,
          useCreateAction,
          useTriggersOptions,
          useWorkflowSyncReaction,
          useSyncAction,
          useRevisionAction,
          TriggerOptionRender,
          ExecutionStatusOptions,
        }}
      />
    </SchemaComponentContext.Provider>
  );
}
