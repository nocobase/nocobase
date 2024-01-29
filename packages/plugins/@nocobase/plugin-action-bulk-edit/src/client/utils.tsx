import { SchemaExpressionScopeContext, useField, useForm } from '@formily/react';
import {
  SchemaInitializerItemType,
  useActionContext,
  useCollection,
  useCollectionManager,
  useCompile,
  useDataBlockResourceV2,
  useDeprecatedContext,
  useRemoveGridFormItem,
  useTableBlockContext,
} from '@nocobase/client';
import { isURL } from '@nocobase/utils/client';
import { App, message } from 'antd';
import { cloneDeep } from 'lodash';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BulkEditFormItemValueType } from './component/BulkEditField';

export const useCustomBulkEditFormItemInitializerFields = (options?: any) => {
  const { name, fields } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const remove = useRemoveGridFormItem();
  const filterFields = useMemo(
    () =>
      fields
        ?.filter((field) => {
          return (
            field?.interface &&
            !field?.uiSchema?.['x-read-pretty'] &&
            field.interface !== 'snapshot' &&
            field.type !== 'sequence'
          );
        })
        .map((field) => {
          const interfaceConfig = getInterface(field.interface);
          const schema = {
            type: 'string',
            name: field.name,
            title: field?.uiSchema?.title || field.name,
            'x-designer': 'FormItem.Designer',
            'x-component': 'BulkEditField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
          };
          return {
            name: field?.uiSchema?.title || field.name,
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            Component: 'CollectionFieldInitializer',
            remove: remove,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field,
                block,
                readPretty,
                targetCollection: getCollection(field.target),
              });
            },
            schema,
          } as SchemaInitializerItemType;
        }),
    [fields],
  );

  return filterFields;
};

export const useCustomizeBulkEditActionProps = () => {
  const deprecatedContext = useDeprecatedContext();
  const resource = useDataBlockResourceV2();
  const form = useForm();
  const { t } = useTranslation();
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const actionContext = useActionContext();
  const navigate = useNavigate();
  const compile = useCompile();
  const actionField = useField();
  const tableBlockContext = useTableBlockContext();
  const { modal } = App.useApp();

  const { rowKey } = tableBlockContext;
  const selectedRecordKeys =
    tableBlockContext.field?.data?.selectedRowKeys ?? expressionScope?.selectedRecordKeys ?? {};
  const { setVisible, fieldSchema: actionSchema } = actionContext;
  return {
    async onClick() {
      const { onSuccess, skipValidator, updateMode } = actionSchema?.['x-action-settings'] ?? {};
      const { filter } = deprecatedContext?.parentService.params?.[0] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = cloneDeep(form.values);
      actionField.data = deprecatedContext?.blockField.data || {};
      actionField.data.loading = true;
      for (const key in values) {
        if (Object.prototype.hasOwnProperty.call(values, key)) {
          const value = values[key];
          if (BulkEditFormItemValueType.Clear in value) {
            values[key] = null;
          } else if (BulkEditFormItemValueType.ChangedTo in value) {
            values[key] = value[BulkEditFormItemValueType.ChangedTo];
          } else if (BulkEditFormItemValueType.RemainsTheSame in value) {
            delete values[key];
          }
        }
      }
      try {
        const updateData: { filter?: any; values: any; forceUpdate: boolean } = {
          values,
          filter,
          forceUpdate: false,
        };
        if (updateMode === 'selected') {
          if (!selectedRecordKeys?.length) {
            message.error(t('Please select the records to be updated'));
            return;
          }
          updateData.filter = { $and: [{ [rowKey || 'id']: { $in: selectedRecordKeys } }] };
        }
        if (!updateData.filter) {
          updateData.forceUpdate = true;
        }
        await resource.update(updateData);
        actionField.data.loading = false;
        // if (!(resource instanceof TableFieldResource)) {
        //   __parent?.__parent?.service?.refresh?.();
        // }
        deprecatedContext?.parentService?.refresh?.();
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
      } finally {
        actionField.data.loading = false;
      }
    },
  };
};
