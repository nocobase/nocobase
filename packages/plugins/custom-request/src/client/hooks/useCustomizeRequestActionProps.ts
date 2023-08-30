import { useField, useFieldSchema, useForm } from '@formily/react';
import {
  TableFieldResource,
  getFormValues,
  useAPIClient,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  useCompile,
  useCurrentUserContext,
  useFilterByTk,
  useRecord,
  useRequest,
} from '@nocobase/client';
import { App } from 'antd';
import { isURL } from '@nocobase/utils/client';
import { useNavigate } from 'react-router-dom';
import { useGetCustomRequest } from './useGetCustomRequest';

export const useCustomizeRequestActionProps = () => {
  const apiClient = useAPIClient();
  const navigate = useNavigate();
  const filterByTk = useFilterByTk();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const form = useForm();
  const { fields, getField, getPrimaryKey } = useCollection();
  const { field, resource, __parent, service } = useBlockRequestContext();
  const record = useRecord();
  const fieldSchema = useFieldSchema();
  const { data } = useGetCustomRequest();
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal, message } = App.useApp();

  return {
    async onClick() {
      const { skipValidator, onSuccess } = actionSchema?.['x-action-settings'] ?? {};
      const options = data?.data?.options;
      if (!options?.['url']) return;
      const xAction = actionSchema?.['x-action'];
      if (skipValidator !== true && xAction === 'customize:form:request') {
        await form.submit();
      }

      const requestConfig = {};
      const methods = ['POST', 'PUT', 'PATCH'];
      if (xAction === 'customize:form:request' && methods.includes(options['method'])) {
        const fieldNames = fields.map((field) => field.name);
        const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
        requestConfig['data'] = values;
      }

      actionField.data ??= {};
      actionField.data.loading = true;
      try {
        await apiClient.request({
          url: `/customRequests:send/${fieldSchema['x-uid']}`,
          method: 'POST',
          data: {
            requestConfig,
            currentRecord: {
              id: record[getPrimaryKey()],
              appends: service.params[0].appends,
            },
          },
        });
        actionField.data.loading = false;
        if (!(resource instanceof TableFieldResource)) {
          __parent?.service?.refresh?.();
        }
        service?.refresh?.();
        if (xAction === 'customize:form:request') {
          setVisible?.(false);
        }
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
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
      } finally {
        actionField.data.loading = false;
      }
    },
  };
};
