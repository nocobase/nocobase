import { SchemaExpressionScopeContext, useField, useFieldSchema, useForm } from '@formily/react';
import { isURL, parse } from '@nocobase/utils/client';
import { App, message } from 'antd';
import _ from 'lodash';
import get from 'lodash/get';
import omit from 'lodash/omit';
import { ChangeEvent, useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  AssociationFilter,
  useCollectionManager,
  useCollectionRecord,
  useDataSourceHeaders,
  useFormActiveFields,
  useFormBlockContext,
  useTableBlockContext,
} from '../..';
import { useAPIClient, useRequest } from '../../api-client';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../collection-manager';
import { useFilterBlock } from '../../filter-provider/FilterProvider';
import { mergeFilter, transformToFilter } from '../../filter-provider/utils';
import { useRecord } from '../../record-provider';
import { removeNullCondition, useActionContext, useCompile } from '../../schema-component';
import { useCurrentUserContext } from '../../user';
import { useLocalVariables, useVariables } from '../../variables';
import { isVariable } from '../../variables/utils/isVariable';
import { transformVariableValue } from '../../variables/utils/transformVariableValue';
import { useBlockRequestContext, useFilterByTk, useParamsFromRecord } from '../BlockProvider';
import { useDetailsBlockContext } from '../DetailsBlockProvider';
import { TableFieldResource } from '../TableFieldProvider';

export * from './useFormActiveFields';
export * from './useParsedFilter';

export const usePickActionProps = () => {
  const form = useForm();
  return {
    onClick() {
      console.log('usePickActionProps', form.values);
    },
  };
};

function renderTemplate(str: string, data: any) {
  const re = /\{\{\s*((\w+\.?)+)\s*\}\}/g;
  return str.replace(re, function (_, key) {
    return get(data, key) || '';
  });
}

const filterValue = (value) => {
  if (typeof value !== 'object') {
    return value;
  }
  if (!value) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => filterValue(v));
  }
  const obj = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const val = value[key];
      if (Array.isArray(val) || (val && typeof val === 'object')) {
        continue;
      }
      obj[key] = val;
    }
  }
  return obj;
};

export function getFormValues({
  filterByTk,
  field,
  form,
  fieldNames,
  getField,
  resource,
  actionFields,
}: {
  filterByTk;
  field;
  form;
  fieldNames;
  getField;
  resource;
  actionFields: any[];
}) {
  if (filterByTk) {
    if (actionFields) {
      const keys = Object.keys(form.values).filter((key) => {
        const f = getField(key);
        return !actionFields.includes(key) && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(f?.type);
      });
      return omit({ ...form.values }, keys);
    }
  }

  return form.values;
}

export function useCollectValuesToSubmit() {
  const form = useForm();
  const filterByTk = useFilterByTk();
  const { field, resource } = useBlockRequestContext();
  const { fields, getField, getTreeParentField, name } = useCollection_deprecated();
  const fieldNames = fields.map((field) => field.name);
  const { fieldSchema } = useActionContext();
  const { getActiveFieldsName } = useFormActiveFields() || {};
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const actionSchema = useFieldSchema();
  const currentRecord = useRecord();

  return useCallback(async () => {
    const { assignedValues: originalAssignedValues = {}, overwriteValues } = actionSchema?.['x-action-settings'] ?? {};
    const values = getFormValues({
      filterByTk,
      field,
      form,
      fieldNames,
      getField,
      resource,
      actionFields: getActiveFieldsName?.('form') || [],
    });

    const assignedValues = {};
    const waitList = Object.keys(originalAssignedValues).map(async (key) => {
      const value = originalAssignedValues[key];
      const collectionField = getField(key);

      if (process.env.NODE_ENV !== 'production') {
        if (!collectionField) {
          throw new Error(`field "${key}" not found in collection "${name}"`);
        }
      }

      if (isVariable(value)) {
        const result = await variables?.parseVariable(value, localVariables);
        if (result) {
          assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
        }
      } else if (value != null && value !== '') {
        assignedValues[key] = value;
      }
    });
    await Promise.all(waitList);
    // const values = omitBy(formValues, (value) => isEqual(JSON.stringify(value), '[{}]'));
    const addChild = fieldSchema?.['x-component-props']?.addChild;
    if (addChild) {
      const treeParentField = getTreeParentField();
      values[treeParentField?.name ?? 'parent'] = omit(currentRecord?.__parent, ['children']);
      values[treeParentField?.foreignKey ?? 'parentId'] = currentRecord?.__parent?.id;
    }

    return {
      ...values,
      ...overwriteValues,
      ...assignedValues,
    };
  }, [
    actionSchema,
    currentRecord?.__parent,
    field,
    fieldNames,
    fieldSchema,
    filterByTk,
    form,
    getActiveFieldsName,
    getField,
    getTreeParentField,
    localVariables,
    name,
    resource,
    variables,
  ]);
}

export const useCreateActionProps = () => {
  const filterByTk = useFilterByTk();
  const record = useCollectionRecord();
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const navigate = useNavigate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const { updateAssociationValues } = useFormBlockContext();
  const collectValues = useCollectValuesToSubmit();
  const action = record.isNew ? 'create' : 'update';
  const filterKeys = actionField.componentProps.filterKeys?.checked || [];
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
        const data = await resource[action]({
          values,
          filterKeys: filterKeys,
          filterByTk,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
          updateAssociationValues,
        });
        setVisible?.(false);
        actionField.data.loading = false;
        actionField.data.data = data;
        __parent?.service?.refresh?.();
        if (!onSuccess?.successMessage) {
          message.success(t('Saved successfully'));
          await form.reset(undefined, { forceClear: true });
          return;
        }
        if (onSuccess?.manualClose) {
          modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset(undefined, { forceClear: true });
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
          await form.reset(undefined, { forceClear: true });
          if (onSuccess?.redirecting && onSuccess?.redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};

export const useAssociationCreateActionProps = () => {
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { setVisible, fieldSchema } = useActionContext();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField, getTreeParentField, name } = useCollection_deprecated();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const { getActiveFieldsName } = useFormActiveFields() || {};

  const action = actionField.componentProps.saveMode || 'create';
  const filterKeys = actionField.componentProps.filterKeys?.checked || [];
  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};
      const addChild = fieldSchema?.['x-component-props']?.addChild;

      const assignedValues = {};
      const waitList = Object.keys(originalAssignedValues).map(async (key) => {
        const value = originalAssignedValues[key];
        const collectionField = getField(key);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            throw new Error(`useAssociationCreateActionProps: field "${key}" not found in collection "${name}"`);
          }
        }

        if (isVariable(value)) {
          const result = await variables?.parseVariable(value, localVariables);
          if (result) {
            assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
          }
        } else if (value != null && value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);

      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues({
        filterByTk,
        field,
        form,
        fieldNames,
        getField,
        resource,
        actionFields: getActiveFieldsName?.('form') || [],
      });
      if (addChild) {
        const treeParentField = getTreeParentField();
        values[treeParentField?.name ?? 'parent'] = currentRecord;
        values[treeParentField?.foreignKey ?? 'parentId'] = currentRecord.id;
      }
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        const data = await resource[action]({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
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
        message.success(compile(onSuccess?.successMessage));
      } catch (error) {
        actionField.data.data = null;
        actionField.data.loading = false;
      }
    },
  };
};

export interface FilterTarget {
  targets?: {
    /** field uid */
    uid: string;
    /** associated field */
    field?: string;
  }[];
  uid?: string;
}

export const findFilterTargets = (fieldSchema): FilterTarget => {
  while (fieldSchema) {
    if (fieldSchema['x-filter-targets']) {
      return {
        targets: fieldSchema['x-filter-targets'],
        uid: fieldSchema['x-uid'],
      };
    }
    fieldSchema = fieldSchema.parent;
  }
  return {};
};

export const updateFilterTargets = (fieldSchema, targets: FilterTarget['targets']) => {
  while (fieldSchema) {
    if (fieldSchema['x-filter-targets']) {
      fieldSchema['x-filter-targets'] = targets;
      return;
    }
    fieldSchema = fieldSchema.parent;
  }
};

export const useFilterBlockActionProps = () => {
  const form = useForm();
  const actionField = useField();
  const fieldSchema = useFieldSchema();
  const { getDataBlocks } = useFilterBlock();
  const { name } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();

  actionField.data = actionField.data || {};

  return {
    async onClick() {
      const { targets = [], uid } = findFilterTargets(fieldSchema);

      actionField.data.loading = true;
      try {
        // 收集 filter 的值
        await Promise.all(
          getDataBlocks().map(async (block) => {
            const target = targets.find((target) => target.uid === block.uid);
            if (!target) return;

            const param = block.service.params?.[0] || {};
            // 保留原有的 filter
            const storedFilter = block.service.params?.[1]?.filters || {};

            storedFilter[uid] = removeNullCondition(
              transformToFilter(form.values, fieldSchema, getCollectionJoinField, name),
            );

            const mergedFilter = mergeFilter([
              ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
              block.defaultFilter,
            ]);

            return block.doFilter(
              {
                ...param,
                page: 1,
                filter: mergedFilter,
              },
              { filters: storedFilter },
            );
          }),
        );
        actionField.data.loading = false;
      } catch (error) {
        console.error(error);
        actionField.data.loading = false;
      }
    },
  };
};

export const useResetBlockActionProps = () => {
  const form = useForm();
  const actionField = useField();
  const fieldSchema = useFieldSchema();
  const { getDataBlocks } = useFilterBlock();

  actionField.data = actionField.data || {};

  return {
    async onClick() {
      const { targets, uid } = findFilterTargets(fieldSchema);

      form.reset();
      actionField.data.loading = true;
      try {
        // 收集 filter 的值
        await Promise.all(
          getDataBlocks().map(async (block) => {
            const target = targets.find((target) => target.uid === block.uid);
            if (!target) return;

            const param = block.service.params?.[0] || {};
            // 保留原有的 filter
            const storedFilter = block.service.params?.[1]?.filters || {};

            delete storedFilter[uid];
            const mergedFilter = mergeFilter([...Object.values(storedFilter), block.defaultFilter]);

            return block.doFilter(
              {
                ...param,
                page: 1,
                filter: mergedFilter,
              },
              { filters: storedFilter },
            );
          }),
        );
        actionField.data.loading = false;
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};

export const useCustomizeUpdateActionProps = () => {
  const { resource, __parent, service } = useBlockRequestContext();
  const filterByTk = useFilterByTk();
  const actionSchema = useFieldSchema();
  const navigate = useNavigate();
  const compile = useCompile();
  const form = useForm();
  const { modal } = App.useApp();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const { name, getField } = useCollection_deprecated();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        skipValidator,
      } = actionSchema?.['x-action-settings'] ?? {};

      const assignedValues = {};
      const waitList = Object.keys(originalAssignedValues).map(async (key) => {
        const value = originalAssignedValues[key];
        const collectionField = getField(key);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            throw new Error(`useCustomizeUpdateActionProps: field "${key}" not found in collection "${name}"`);
          }
        }

        if (isVariable(value)) {
          const result = await variables?.parseVariable(value, localVariables);
          if (result) {
            assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
          }
        } else if (value != null && value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);

      if (skipValidator === false) {
        await form.submit();
      }
      await resource.update({
        filterByTk,
        values: { ...assignedValues },
      });
      service?.refresh?.();
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
    },
  };
};

export const useCustomizeBulkUpdateActionProps = () => {
  const { field, resource, __parent, service } = useBlockRequestContext();
  const expressionScope = useContext(SchemaExpressionScopeContext);
  const actionSchema = useFieldSchema();
  const tableBlockContext = useTableBlockContext();
  const { rowKey } = tableBlockContext;
  const selectedRecordKeys =
    tableBlockContext.field?.data?.selectedRowKeys ?? expressionScope?.selectedRecordKeys ?? {};
  const navigate = useNavigate();
  const compile = useCompile();
  const { t } = useTranslation();
  const actionField = useField();
  const { modal } = App.useApp();
  const variables = useVariables();
  const record = useRecord();
  const { name, getField } = useCollection_deprecated();
  const localVariables = useLocalVariables();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        updateMode,
      } = actionSchema?.['x-action-settings'] ?? {};
      actionField.data = field.data || {};
      actionField.data.loading = true;

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
          const result = await variables?.parseVariable(value, localVariables);
          if (result) {
            assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
          }
        } else if (value != null && value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);

      modal.confirm({
        title: t('Bulk update'),
        content: updateMode === 'selected' ? t('Update selected data?') : t('Update all data?'),
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
          service?.refresh?.();
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
        },
        async onCancel() {
          actionField.data.loading = false;
        },
      });
    },
  };
};

export const useCustomizeRequestActionProps = () => {
  const apiClient = useAPIClient();
  const navigate = useNavigate();
  const filterByTk = useFilterByTk();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const form = useForm();
  const { fields, getField } = useCollection_deprecated();
  const { field, resource, __parent, service } = useBlockRequestContext();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal } = App.useApp();
  const { getActiveFieldsName } = useFormActiveFields() || {};

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
        const values = getFormValues({
          filterByTk,
          field,
          form,
          fieldNames,
          getField,
          resource,
          actionFields: getActiveFieldsName?.('form') || [],
        });
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

export const useUpdateActionProps = () => {
  const form = useForm();
  const filterByTk = useFilterByTk();
  const { field, resource, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const actionSchema = useFieldSchema();
  const navigate = useNavigate();
  const { fields, getField, name } = useCollection_deprecated();
  const compile = useCompile();
  const actionField = useField();
  const { updateAssociationValues } = useFormBlockContext();
  const { modal } = App.useApp();
  const data = useParamsFromRecord();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const { getActiveFieldsName } = useFormActiveFields() || {};

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};

      const assignedValues = {};
      const waitList = Object.keys(originalAssignedValues).map(async (key) => {
        const value = originalAssignedValues[key];
        const collectionField = getField(key);

        if (process.env.NODE_ENV !== 'production') {
          if (!collectionField) {
            throw new Error(`useUpdateActionProps: field "${key}" not found in collection "${name}"`);
          }
        }

        if (isVariable(value)) {
          const result = await variables?.parseVariable(value, localVariables);
          if (result) {
            assignedValues[key] = transformVariableValue(result, { targetCollectionField: collectionField });
          }
        } else if (value != null && value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);

      if (!skipValidator) {
        await form.submit();
      }
      const fieldNames = fields.map((field) => field.name);
      const values = getFormValues({
        filterByTk,
        field,
        form,
        fieldNames,
        getField,
        resource,
        actionFields: getActiveFieldsName?.('form') || [],
      });
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        await resource.update({
          filterByTk,
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
          ...data,
          updateAssociationValues,
          // TODO(refactor): should change to inject by plugin
          triggerWorkflows: triggerWorkflows?.length
            ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
            : undefined,
        });
        actionField.data.loading = false;
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
          if (onSuccess?.redirecting && onSuccess?.redirectTo) {
            if (isURL(onSuccess.redirectTo)) {
              window.location.href = onSuccess.redirectTo;
            } else {
              navigate(onSuccess.redirectTo);
            }
          }
        }
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};

export const useDestroyActionProps = () => {
  const filterByTk = useFilterByTk();
  const { resource, service, block, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const data = useParamsFromRecord();
  return {
    async onClick() {
      await resource.destroy({
        filterByTk,
        ...data,
      });

      const { count = 0, page = 0, pageSize = 0 } = service?.data?.meta || {};
      if (count % pageSize === 1 && page !== 1) {
        service.run({
          ...service?.params?.[0],
          page: page - 1,
        });
      } else {
        service?.refresh?.();
      }

      if (block && block !== 'TableField') {
        __parent?.service?.refresh?.();
        setVisible?.(false);
      }
    },
  };
};

export const useRemoveActionProps = (associationName) => {
  const filterByTk = useFilterByTk();
  const api = useAPIClient();
  const resource = api.resource(associationName, filterByTk);
  return {
    async onClick(value) {
      await resource.remove({
        values: [value.id],
      });
    },
  };
};

export const useDetailPrintActionProps = () => {
  const { formBlockRef } = useFormBlockContext();

  const printHandler = useReactToPrint({
    content: () => formBlockRef.current,
    pageStyle: `@media print {
      * {
        margin: 0;
      }
      :not(.ant-formily-item-control-content-component) > div.ant-formily-layout>div:first-child {
        overflow: hidden; height: 0;
      }
    }`,
  });
  return {
    async onClick() {
      printHandler();
    },
  };
};

export const useBulkDestroyActionProps = () => {
  const { field } = useBlockRequestContext();
  const { resource, service } = useBlockRequestContext();
  return {
    async onClick() {
      if (!field?.data?.selectedRowKeys?.length) {
        return;
      }
      await resource.destroy({
        filterByTk: field.data?.selectedRowKeys,
      });
      field.data.selectedRowKeys = [];
      service?.refresh?.();
    },
  };
};

export const useRefreshActionProps = () => {
  const { service } = useBlockRequestContext();
  return {
    async onClick() {
      service?.refresh?.();
    },
  };
};

export const useDetailsPaginationProps = () => {
  const ctx = useDetailsBlockContext();
  const count = ctx.service?.data?.meta?.count || 0;
  return {
    simple: true,
    hidden: count <= 1,
    current: ctx.service?.data?.meta?.page || 1,
    total: count,
    pageSize: 1,
    showSizeChanger: false,
    async onChange(page) {
      const params = ctx.service?.params?.[0];
      ctx.service.run({ ...params, page });
    },
    style: {
      marginTop: 24,
      textAlign: 'center',
    },
  };
};

export const useAssociationFilterProps = () => {
  const collectionField = AssociationFilter.useAssociationField();
  const { service, props: blockProps } = useBlockRequestContext();
  const fieldSchema = useFieldSchema();
  const cm = useCollectionManager_deprecated();
  const valueKey = collectionField?.target ? cm.getCollection(collectionField.target)?.getPrimaryKey() : 'id';
  const labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;
  const field = useField();
  const collectionFieldName = collectionField.name;
  const headers = useDataSourceHeaders(blockProps?.dataSource);
  const { data, params, run } = useRequest<{
    data: { [key: string]: any }[];
  }>(
    {
      headers,
      resource: collectionField.target,
      action: 'list',
      params: {
        fields: [labelKey, valueKey],
        pageSize: 200,
        page: 1,
        ...field.componentProps?.params,
      },
    },
    {
      refreshDeps: [labelKey, valueKey, JSON.stringify(field.componentProps?.params || {})],
      debounceWait: 300,
    },
  );

  const list = data?.data || [];
  const onSelected = (value) => {
    const filters = service.params?.[1]?.filters || {};
    if (value.length) {
      filters[`af.${collectionFieldName}`] = {
        [`${collectionFieldName}.${valueKey}.$in`]: value,
      };
    } else {
      delete filters[`af.${collectionFieldName}`];
    }
    service.run(
      {
        ...service.params?.[0],
        pageSize: 200,
        page: 1,
        filter: mergeFilter([...Object.values(filters), blockProps?.params?.filter]),
      },
      { filters },
    );
  };
  const handleSearchInput = (e: ChangeEvent<any>) => {
    run({
      ...params?.[0],
      filter: {
        [`${labelKey}.$includes`]: e.target.value,
      },
    });
  };

  return {
    /** 渲染 Collapse 的列表数据 */
    list,
    onSelected,
    handleSearchInput,
    params,
    run,
  };
};

export const useOptionalFieldList = () => {
  const { currentFields = [] } = useCollection_deprecated();

  return currentFields.filter((field) => isOptionalField(field) && field.uiSchema.enum);
};

const isOptionalField = (field) => {
  const optionalInterfaces = ['select', 'multipleSelect', 'checkbox', 'checkboxGroup', 'chinaRegion'];
  return optionalInterfaces.includes(field.interface);
};

export const useAssociationFilterBlockProps = () => {
  const collectionField = AssociationFilter.useAssociationField();
  const fieldSchema = useFieldSchema();
  const optionalFieldList = useOptionalFieldList();
  const { getDataBlocks } = useFilterBlock();
  const collectionFieldName = collectionField?.name;
  const field = useField();
  const { props: blockProps } = useBlockRequestContext();
  const headers = useDataSourceHeaders(blockProps?.dataSource);
  const cm = useCollectionManager_deprecated();

  let list, handleSearchInput, params, run, data, valueKey, labelKey, filterKey;

  valueKey = collectionField?.target ? cm.getCollection(collectionField.target)?.getPrimaryKey() : 'id';
  labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  // eslint-disable-next-line prefer-const
  ({ data, params, run } = useRequest<{
    data: { [key: string]: any }[];
  }>(
    {
      headers,
      resource: collectionField?.target,
      action: 'list',
      params: {
        fields: [labelKey, valueKey],
        pageSize: 200,
        page: 1,
        ...field.componentProps?.params,
      },
    },
    {
      // 由于 选项字段不需要触发当前请求，所以当前请求更改为手动触发
      manual: true,
      debounceWait: 300,
    },
  ));

  useEffect(() => {
    // 由于 选项字段不需要触发当前请求，所以请求单独在 关系字段的时候触发
    if (!isOptionalField(fieldSchema)) {
      run();
    }
  }, [labelKey, valueKey, JSON.stringify(field.componentProps?.params || {}), isOptionalField(fieldSchema)]);

  if (!collectionField) {
    return {};
  }

  if (isOptionalField(fieldSchema)) {
    const field = optionalFieldList.find((field) => field.name === fieldSchema.name);
    const operatorMap = {
      select: '$in',
      multipleSelect: '$anyOf',
      checkbox: '$in',
      checkboxGroup: '$anyOf',
    };
    const _list = field?.uiSchema?.enum || [];
    valueKey = 'value';
    labelKey = 'label';
    list = _list;
    params = {};
    run = () => {};
    filterKey = `${field.name}.${operatorMap[field.interface]}`;
    handleSearchInput = (e) => {
      // TODO: 列表没有刷新，在这个 hook 中使用 useState 会产生 re-render 次数过多的错误
      const value = e.target.value;
      if (!value) {
        list = _list;
        return;
      }
      list = (_list as any[]).filter((item) => item.label.includes(value));
    };
  } else {
    filterKey = `${collectionFieldName}.${valueKey}.$in`;
    list = data?.data || [];
    handleSearchInput = (e: ChangeEvent<any>) => {
      run({
        ...params?.[0],
        filter: {
          [`${labelKey}.$includes`]: e.target.value,
        },
      });
    };
  }

  const onSelected = (value) => {
    const { targets, uid } = findFilterTargets(fieldSchema);

    getDataBlocks().forEach((block) => {
      const target = targets.find((target) => target.uid === block.uid);
      if (!target) return;

      const key = `${uid}${fieldSchema.name}`;
      const param = block.service.params?.[0] || {};
      // 保留原有的 filter
      const storedFilter = block.service.params?.[1]?.filters || {};
      if (value.length) {
        storedFilter[key] = {
          [filterKey]: value,
        };
      } else {
        delete storedFilter[key];
      }

      const mergedFilter = mergeFilter([...Object.values(storedFilter), block.defaultFilter]);

      return block.doFilter(
        {
          ...param,
          page: 1,
          filter: mergedFilter,
        },
        { filters: storedFilter },
      );
    });
  };

  return {
    /** 渲染 Collapse 的列表数据 */
    list,
    onSelected,
    handleSearchInput,
    params,
    run,
    valueKey,
    labelKey,
  };
};
export function getAssociationPath(str) {
  const lastIndex = str.lastIndexOf('.');
  if (lastIndex !== -1) {
    return str.substring(0, lastIndex);
  }
  return str;
}

export const useAssociationNames = (dataSource?: string) => {
  let updateAssociationValues = new Set([]);
  let appends = new Set([]);
  const { getCollectionJoinField, getCollection } = useCollectionManager_deprecated(dataSource);
  const fieldSchema = useFieldSchema();
  const _getAssociationAppends = (schema, str) => {
    schema.reduceProperties((pre, s) => {
      const prefix = pre || str;
      const collectionField = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field'], dataSource);
      const isAssociationSubfield = s.name.includes('.');
      const isAssociationField =
        collectionField && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionField.type);

      // 根据联动规则中条件的字段获取一些 appends
      if (s['x-linkage-rules']) {
        const collectAppends = (obj) => {
          const type = Object.keys(obj)[0] || '$and';
          const list = obj[type];

          list.forEach((item) => {
            if ('$and' in item || '$or' in item) {
              return collectAppends(item);
            }

            const fieldNames = getTargetField(item);

            // 只应该收集关系字段，只有大于 1 的时候才是关系字段
            if (fieldNames.length > 1) {
              appends.add(fieldNames.join('.'));
            }
          });
        };

        const rules = s['x-linkage-rules'];
        rules.forEach(({ condition }) => {
          collectAppends(condition);
        });
      }

      const isTreeCollection = isAssociationField && getCollection(collectionField.target)?.template === 'tree';
      if (collectionField && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
        const fieldPath = !isAssociationField && isAssociationSubfield ? getAssociationPath(s.name) : s.name;
        const path = prefix === '' || !prefix ? fieldPath : prefix + '.' + fieldPath;
        if (isTreeCollection) {
          appends.add(path);
          appends.add(`${path}.parent` + '(recursively=true)');
        } else {
          appends.add(path);
        }
        if (['Nester', 'SubTable', 'PopoverNester'].includes(s['x-component-props']?.mode)) {
          updateAssociationValues.add(path);
          const bufPrefix = prefix && prefix !== '' ? prefix + '.' + s.name : s.name;
          _getAssociationAppends(s, bufPrefix);
        }
      } else if (
        ![
          'ActionBar',
          'Action',
          'Action.Link',
          'Action.Modal',
          'Selector',
          'Viewer',
          'AddNewer',
          'AssociationField.Selector',
          'AssociationField.AddNewer',
          'TableField',
        ].includes(s['x-component'])
      ) {
        _getAssociationAppends(s, str);
      }
    }, str);
  };
  const getAssociationAppends = () => {
    updateAssociationValues = new Set([]);
    appends = new Set([]);
    _getAssociationAppends(fieldSchema, '');
    return { appends: [...appends], updateAssociationValues: [...updateAssociationValues] };
  };

  return { getAssociationAppends };
};

function getTargetField(obj) {
  function getAllKeys(obj) {
    const keys = [];
    function traverse(o) {
      Object.keys(o)
        .sort()
        .forEach(function (key) {
          keys.push(key);
          if (o[key] && typeof o[key] === 'object') {
            traverse(o[key]);
          }
        });
    }
    traverse(obj);
    return keys;
  }

  const keys = getAllKeys(obj);
  const index = _.findIndex(keys, (key: string, index: number) => {
    if (key.includes('$') && index > 0) {
      return true;
    }
  });
  const result = keys.slice(0, index);
  return result;
}
