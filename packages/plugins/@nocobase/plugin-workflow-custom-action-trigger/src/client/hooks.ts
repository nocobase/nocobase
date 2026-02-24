/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useField, useFieldSchema, useForm } from '@formily/react';

import {
  getVariableValue,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollectValuesToSubmit,
  useCollection,
  useCollectionRecordData,
  useCompile,
  useFilterByTk,
  useLocalVariables,
  useVariables,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { lang } from './locale';

export function useGlobalTriggerWorkflowCustomActionProps() {
  const apiClient = useAPIClient();
  const { setVisible } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal, message } = App.useApp();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick(e, callback) {
      const { onSuccess, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};

      if (!triggerWorkflows?.length) {
        message.error(lang('Button is not configured properly, please contact the administrator.'));
        return;
      }

      actionField.data = actionField.data || {};
      actionField.data.loading = true;
      try {
        const data = await apiClient.resource('workflows').trigger({
          // values,
          triggerWorkflows: triggerWorkflows
            .map((row) => [row.workflowKey, row.context].filter(Boolean).join('!'))
            .join(','),
        });
        actionField.data.data = data;
        callback?.();
        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        const redirectTo = await getVariableValue(rawRedirectTo, {
          variables,
          localVariables,
        });
        if (!successMessage) {
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            onOk: async () => {
              if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
                if (isURL(redirectTo)) {
                  window.location.href = redirectTo;
                } else {
                  navigate(redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(successMessage));
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        actionField.data.loading = false;
      }
    },
  };
}

export function useCollectionTriggerWorkflowCustomActionProps() {
  const apiClient = useAPIClient();
  const { setVisible } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal, message } = App.useApp();
  const collection = useCollection();
  const { field } = useBlockRequestContext();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick(e, callback) {
      const { onSuccess, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};

      if (!triggerWorkflows?.length) {
        message.error(lang('Button is not configured properly, please contact the administrator.'));
        return;
      }

      if (!field.data?.selectedRowKeys?.length) {
        message.error(lang('Please select at least one record.'));
        return;
      }

      // const values = await collectValues();
      actionField.data = actionField.data || {};
      actionField.data.loading = true;

      try {
        const data = await apiClient
          .resource(collection.name, [][0], { 'x-data-source': collection.dataSource })
          .trigger({
            filterByTk: field.data?.selectedRowKeys,
            // values,
            triggerWorkflows: triggerWorkflows?.length
              ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
              : undefined,
          });
        if (field.data?.clearSelectedRowKeys) {
          field.data.clearSelectedRowKeys();
        }
        actionField.data.data = data;
        callback?.();
        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        const redirectTo = await getVariableValue(rawRedirectTo, {
          variables,
          localVariables,
        });
        if (!successMessage) {
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            onOk: async () => {
              if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
                if (isURL(redirectTo)) {
                  window.location.href = redirectTo;
                } else {
                  navigate(redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(successMessage));
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        actionField.data.loading = false;
      }
    },
  };
}

export function useFormWorkflowCustomActionProps() {
  const form = useForm();
  const { field, resource } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const filterByTk = useFilterByTk();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal, message } = App.useApp();
  const collectValues = useCollectValuesToSubmit();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick(e, callback) {
      const { onSuccess, skipValidator, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};

      if (!triggerWorkflows?.length) {
        message.error(lang('Button is not configured properly, please contact the administrator.'));
        return;
      }

      if (!skipValidator) {
        await form.submit();
      }
      const values = await collectValues();
      actionField.data = actionField.data || {};
      actionField.data.loading = true;
      try {
        const data = await resource.trigger({
          values,
          filterByTk,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        actionField.data.data = data;
        // __parent?.service?.refresh?.();
        callback?.();
        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        const redirectTo = await getVariableValue(rawRedirectTo, {
          variables,
          localVariables,
        });
        if (!successMessage) {
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            onOk: async () => {
              await form.reset();
              if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
                if (isURL(redirectTo)) {
                  window.location.href = redirectTo;
                } else {
                  navigate(redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(successMessage));
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        actionField.data.loading = false;
      }
    },
  };
}

export function useRecordWorkflowCustomTriggerActionProps() {
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const record = useCollectionRecordData();
  const actionField = useField();
  const actionSchema = useFieldSchema();
  const { field, resource } = useBlockRequestContext();
  const { setVisible, setSubmitted } = useActionContext();
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick(e?, callBack?) {
      const { onSuccess, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};

      if (!triggerWorkflows?.length) {
        message.error(lang('Button is not configured properly, please contact the administrator.'));
        return;
      }

      actionField.data = actionField.data || {};
      actionField.data.loading = true;

      try {
        await resource.trigger({
          filterByTk,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        // __parent?.service?.refresh?.();
        if (callBack) {
          callBack();
        }
        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        setSubmitted?.(true);
        const redirectTo = await getVariableValue(rawRedirectTo, {
          variables,
          localVariables: [...localVariables, { name: '$record', ctx: new Proxy(record, {}) }],
        });
        if (!successMessage) {
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            async onOk() {
              if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
                if (isURL(redirectTo)) {
                  window.location.href = redirectTo;
                } else {
                  navigate(redirectTo);
                }
              }
            },
          });
        } else {
          message.success(compile(successMessage));
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        actionField.data.loading = false;
      }
    },
  };
}
