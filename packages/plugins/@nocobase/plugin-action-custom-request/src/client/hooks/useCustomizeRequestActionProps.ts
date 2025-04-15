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
  const { name: blockType } = useBlockContext() || {};
  // const { getPrimaryKey } = useCollection_deprecated();
  const recordData = useCollectionRecordData();
  const fieldSchema = useFieldSchema();
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal, message } = App.useApp();
  const dataSourceKey = useDataSourceKey();
  return {
    async onClick(e?, callBack?) {
      const { skipValidator, onSuccess } = actionSchema?.['x-action-settings'] ?? {};
      const { manualClose, redirecting, redirectTo, successMessage, actionAfterSuccess } = onSuccess || {};
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
        const res = await apiClient.request({
          url: `/customRequests:send/${fieldSchema['x-uid']}`,
          method: 'POST',
          data: {
            currentRecord: {
              // id: record[getPrimaryKey()],
              // appends: result.params[0]?.appends,
              dataSourceKey,
              data: currentRecordData,
            },
            $nForm: blockType === 'form' ? form.values : undefined,
          },
          responseType: fieldSchema['x-response-type'] === 'stream' ? 'blob' : 'json',
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
