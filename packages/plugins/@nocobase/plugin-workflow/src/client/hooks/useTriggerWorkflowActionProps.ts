import { useNavigate } from 'react-router-dom';
import { App, message } from 'antd';
import { useField, useFieldSchema, useForm } from '@formily/react';

import {
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollectValuesToSubmit,
  useCompile,
  useRecord,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';

export function useTriggerWorkflowsActionProps() {
  const api = useAPIClient();
  const form = useForm();
  const { field, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal } = App.useApp();
  const collectValues = useCollectValuesToSubmit();

  const filterKeys = actionField.componentProps.filterKeys || [];

  return {
    async onClick() {
      const { onSuccess, skipValidator, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = await collectValues();
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        const data = await api.resource('workflows').trigger({
          values,
          filterKeys: filterKeys,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        actionField.data.loading = false;
        actionField.data.data = data;
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  navigate(onSuccess.redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(onSuccess?.successMessage));
        }
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
}

export function useRecordTriggerWorkflowsActionProps() {
  const compile = useCompile();
  const api = useAPIClient();
  const record = useRecord();
  const actionField = useField();
  const actionSchema = useFieldSchema();
  const { field, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const { modal } = App.useApp();
  const navigate = useNavigate();
  const { onSuccess, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};

  return {
    async onClick() {
      actionField.data = field.data || {};
      actionField.data.loading = true;

      try {
        await api.resource('workflows').trigger({
          values: record,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          modal.success({
            title: compile(onSuccess?.successMessage),
            async onOk() {
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  navigate(onSuccess.redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(onSuccess?.successMessage));
        }
      } catch (error) {
        console.error(error);
      } finally {
        actionField.data.loading = false;
      }
    },
  };
}
