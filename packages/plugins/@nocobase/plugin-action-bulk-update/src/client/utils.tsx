/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaExpressionScopeContext, useField, useFieldSchema } from '@formily/react';
import {
  TableFieldResource,
  isVariable,
  transformVariableValue,
  useBlockRequestContext,
  useCollection_deprecated,
  useCompile,
  useLocalVariables,
  useNavigateNoUpdate,
  useTableBlockContext,
  useVariables,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { App, message } from 'antd';
import { useContext } from 'react';
import { useBulkUpdateTranslation } from './locale';

export const useCustomizeBulkUpdateActionProps = () => {
  const { field, resource, __parent, service } = useBlockRequestContext();
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const actionSchema = useFieldSchema();
  const tableBlockContext = useTableBlockContext();
  const { rowKey } = tableBlockContext;

  const navigate = useNavigateNoUpdate();
  const compile = useCompile();
  const { t } = useBulkUpdateTranslation();
  const actionField: any = useField();
  const { modal } = App.useApp();
  const variables = useVariables();
  const { name, getField } = useCollection_deprecated();
  const localVariables = useLocalVariables();
  return {
    async onClick(e, callBack) {
      return new Promise<void>(async (resolve) => {
        const {
          assignedValues: originalAssignedValues = {},
          onSuccess,
          updateMode,
        } = actionSchema?.['x-action-settings'] ?? {};
        actionField.data = field.data || {};
        actionField.data.loading = true;
        const selectedRecordKeys =
          tableBlockContext.field?.data?.selectedRowKeys ?? expressionScope?.selectedRecordKeys ?? {};

        const assignedValues = {};
        const waitList = Object.keys(originalAssignedValues).map(async (key) => {
          const value = originalAssignedValues[key];
          const collectionField = getField(key);

          if (process.env.NODE_ENV !== 'production') {
            if (!collectionField) {
              throw new Error(`useCustomizeBulkUpdateActionProps: field "${key}" not found in collection "${name}"`);
            }
          }

          if (isVariable(value)) {
            const result = await variables?.parseVariable(value, localVariables).then(({ value }) => value);
            if (result) {
              assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
            }
          } else if (value !== '') {
            assignedValues[key] = value;
          }
        });
        await Promise.all(waitList);

        modal.confirm({
          title: t('Bulk update', { ns: 'client' }),
          content:
            updateMode === 'selected'
              ? t('Update selected data?', { ns: 'client' })
              : t('Update all data?', { ns: 'client' }),
          async onOk() {
            const { filter } = service.params?.[0] ?? {};
            const updateData: { filter?: any; values: any; forceUpdate: boolean } = {
              values: { ...assignedValues },
              filter,
              forceUpdate: false,
            };
            if (updateMode === 'selected') {
              if (!selectedRecordKeys?.length) {
                message.error(t('Please select the records to be updated'));
                actionField.data.loading = false;
                return;
              }
              updateData.filter = { $and: [{ [rowKey || 'id']: { $in: selectedRecordKeys } }] };
            }
            if (!updateData.filter) {
              updateData.forceUpdate = true;
            }
            try {
              await resource.update(updateData);
            } catch (error) {
              /* empty */
            } finally {
              actionField.data.loading = false;
            }
            if (callBack) {
              callBack?.();
            }
            // service?.refresh?.();
            if (!(resource instanceof TableFieldResource)) {
              __parent?.service?.refresh?.();
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
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  navigate(onSuccess.redirectTo);
                }
              }
            }

            resolve();
          },
          async onCancel() {
            actionField.data.loading = false;
            resolve();
          },
        });
      });

    },
  };
};
