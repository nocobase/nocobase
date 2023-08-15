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
} from '@nocobase/client';
import { parse } from '@nocobase/utils';
import { App } from 'antd';
import { isURL } from '@nocobase/utils/client';
import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';

function renderTemplate(str: string, data: any) {
  const re = /\{\{\s*((\w+\.?)+)\s*\}\}/g;
  return str.replace(re, function (_, key) {
    return get(data, key) || '';
  });
}

export const useCustomizeRequestActionProps = () => {
  const apiClient = useAPIClient();
  const navigate = useNavigate();
  const filterByTk = useFilterByTk();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const form = useForm();
  const { fields, getField } = useCollection();
  const { field, resource, __parent, service } = useBlockRequestContext();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal, message } = App.useApp();

  return {
    async onClick() {
      const { skipValidator, onSuccess, requestSettings } = actionSchema?.['x-action-settings'] ?? {};
      const xAction = actionSchema?.['x-action'];
      if (!requestSettings['url']) {
        return;
      }
      if (skipValidator !== true && xAction === 'customize:form:request') {
        await form.submit();
      }

      const headers = requestSettings['headers'] ? JSON.parse(requestSettings['headers']) : {};
      const params = requestSettings['params'] ? JSON.parse(requestSettings['params']) : {};
      const data = requestSettings['data'] ? JSON.parse(requestSettings['data']) : {};
      const methods = ['POST', 'PUT', 'PATCH'];
      if (xAction === 'customize:form:request' && methods.includes(requestSettings['method'])) {
        const fieldNames = fields.map((field) => field.name);
        const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
        Object.assign(data, values);
      }
      const requestBody = {
        url: renderTemplate(requestSettings['url'], { currentRecord, currentUser }),
        method: requestSettings['method'],
        headers: parse(headers)({ currentRecord, currentUser }),
        params: parse(params)({ currentRecord, currentUser }),
        data: parse(data)({ currentRecord, currentUser }),
      };
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        await apiClient.request({
          ...requestBody,
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
