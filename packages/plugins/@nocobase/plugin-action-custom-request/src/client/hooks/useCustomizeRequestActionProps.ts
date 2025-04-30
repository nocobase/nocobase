/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema, useForm } from '@formily/react';
import {
  useAPIClient,
  useActionContext,
  useBlockContext,
  useCollectionRecordData,
  useCompile,
  useDataSourceKey,
  useNavigateNoUpdate,
  useBlockRequestContext,
  useContextVariable,
  useLocalVariables,
  useVariables,
  getVariableValue,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { App } from 'antd';
import { saveAs } from 'file-saver';

export const useCustomizeRequestActionProps = () => {
  const apiClient = useAPIClient();
  const navigate = useNavigateNoUpdate();
  const actionSchema = useFieldSchema();
  const { field } = useBlockRequestContext();
  const compile = useCompile();
  const form = useForm();
  const { name: blockType } = useBlockContext() || {};
  const recordData = useCollectionRecordData();
  const fieldSchema = useFieldSchema();
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal, message } = App.useApp();
  const dataSourceKey = useDataSourceKey();
  const { ctx } = useContextVariable();
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick(e?, callBack?) {
      const selectedRecord = field?.data?.selectedRowData ? field?.data?.selectedRowData : ctx;
      const { skipValidator, onSuccess } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo,
        successMessage: rawSuccessMessage,
        actionAfterSuccess,
      } = onSuccess || {};
      let successMessage = rawSuccessMessage;
      const xAction = actionSchema?.['x-action'];
      if (skipValidator !== true && xAction === 'customize:form:request') {
        await form.submit();
      }

      let currentRecordData = { ...recordData };
      if (xAction === 'customize:form:request') {
        currentRecordData = form.values;
      }

      actionField.data ??= {};
      actionField.data.loading = true;
      try {
        const requestId = fieldSchema['x-custom-request-id'] || fieldSchema['x-uid'];
        const res = await apiClient.request({
          url: `/customRequests:send/${requestId}`,
          method: 'POST',
          data: {
            currentRecord: {
              dataSourceKey,
              data: currentRecordData,
            },
            $nForm: blockType === 'form' ? form.values : undefined,
            $nSelectedRecord: selectedRecord,
          },
          responseType: fieldSchema['x-response-type'] === 'stream' ? 'blob' : 'json',
        });
        successMessage = await getVariableValue(successMessage, {
          variables,
          localVariables: [
            ...localVariables,
            { name: '$nResponse', ctx: new Proxy({ ...res?.data?.data, ...res?.data }, {}) },
          ],
        });
        if (res.headers['content-disposition']) {
          const contentDisposition = res.headers['content-disposition'];
          const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
          const asciiMatch = contentDisposition.match(/filename="([^"]+)"/i);
          if (utf8Match) {
            saveAs(res.data, decodeURIComponent(utf8Match[1]));
          } else if (asciiMatch) {
            saveAs(res.data, asciiMatch[1]);
          }
        }
        actionField.data.loading = false;
        // service?.refresh?.();
        if (callBack) {
          callBack?.();
        }
        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
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
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
        }
      } finally {
        actionField.data.loading = false;
      }
    },
  };
};
