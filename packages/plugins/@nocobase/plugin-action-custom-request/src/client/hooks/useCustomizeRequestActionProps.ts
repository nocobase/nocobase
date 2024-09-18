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
  useCompile,
  useDataSourceKey,
  useNavigateNoUpdate,
  useRecord,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { App } from 'antd';
import { saveAs } from 'file-saver';

export const useCustomizeRequestActionProps = () => {
  const apiClient = useAPIClient();
  const navigate = useNavigateNoUpdate();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const form = useForm();
  // const { getPrimaryKey } = useCollection_deprecated();
  const record = useRecord();
  const fieldSchema = useFieldSchema();
  const actionField = useField();
  const { setVisible, visible } = useActionContext();
  const { modal, message } = App.useApp();
  const dataSourceKey = useDataSourceKey();
  return {
    async onClick(e?, callBack?) {
      const { skipValidator, onSuccess } = actionSchema?.['x-action-settings'] ?? {};
      const { manualClose, redirecting, redirectTo, successMessage } = onSuccess || {};
      const xAction = actionSchema?.['x-action'];
      if (skipValidator !== true && xAction === 'customize:form:request') {
        await form.submit();
      }

      let formValues = { ...record };
      if (xAction === 'customize:form:request') {
        formValues = form.values;
      }

      actionField.data ??= {};
      actionField.data.loading = true;
      try {
        const res = await apiClient.request({
          url: `/customRequests:send/${fieldSchema['x-uid']}`,
          method: 'POST',
          data: {
            currentRecord: {
              // id: record[getPrimaryKey()],
              // appends: result.params[0]?.appends,
              dataSourceKey,
              data: formValues,
            },
          },
          responseType: fieldSchema['x-response-type'] === 'stream' ? 'blob' : 'json',
        });
        if (res.headers['content-disposition']) {
          const regex = /attachment;\s*filename="([^"]+)"/;
          const match = res.headers['content-disposition'].match(regex);
          if (match?.[1]) {
            saveAs(res.data, match[1]);
          }
        }
        actionField.data.loading = false;
        if (callBack) {
          callBack?.();
        }
        if (!successMessage) {
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            onOk: async () => {
              if (redirecting === 'previous') {
                if (xAction === 'customize:form:request') {
                  visible ? setVisible?.(false) : navigate(-1);
                }
              }
              if (redirecting && redirectTo) {
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
          if (redirecting === 'previous') {
            if (xAction === 'customize:form:request') {
              visible ? setVisible?.(false) : navigate(-1);
            }
          }
          if (redirecting && redirectTo) {
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
