import { SchemaExpressionScopeContext, useField, useFieldSchema, useForm } from '@formily/react';
import { isURL, parse } from '@nocobase/utils/client';
import { App, message } from 'antd';
import { cloneDeep } from 'lodash';
import get from 'lodash/get';
import omit from 'lodash/omit';
import { ChangeEvent, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { AssociationFilter, useFormBlockContext, useTableBlockContext } from '../..';
import { useAPIClient, useRequest } from '../../api-client';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { useFilterBlock } from '../../filter-provider/FilterProvider';
import { transformToFilter } from '../../filter-provider/utils';
import { useRecord } from '../../record-provider';
import { removeNullCondition, useActionContext, useCompile } from '../../schema-component';
import { BulkEditFormItemValueType } from '../../schema-initializer/components';
import { useCurrentUserContext } from '../../user';
import { useBlockRequestContext, useFilterByTk, useParamsFromRecord } from '../BlockProvider';
import { useDetailsBlockContext } from '../DetailsBlockProvider';
import { mergeFilter } from '../SharedFilterProvider';
import { TableFieldResource } from '../TableFieldProvider';

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

function getFormValues(filterByTk, field, form, fieldNames, getField, resource) {
  if (filterByTk) {
    const actionFields = field?.data?.activeFields as Set<string>;
    if (actionFields) {
      const keys = Object.keys(form.values).filter((key) => {
        const f = getField(key);
        return !actionFields.has(key) && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(f?.type);
      });
      return omit({ ...form.values }, keys);
    }
  }

  return form.values;
  const values = {};
  for (const key in form.values) {
    if (fieldNames.includes(key)) {
      const collectionField = getField(key);
      if (filterByTk) {
        if (field.added && !field.added.has(key)) {
          continue;
        }
        if (['subTable', 'o2m', 'o2o', 'oho', 'obo', 'm2o'].includes(collectionField.interface)) {
          values[key] = form.values[key];
          continue;
        }
      }
      const items = form.values[key];
      if (['linkTo', 'm2o', 'm2m'].includes(collectionField.interface)) {
        const targetKey = collectionField.targetKey || 'id';
        if (resource instanceof TableFieldResource) {
          if (Array.isArray(items)) {
            values[key] = filterValue(items);
          } else if (items && typeof items === 'object') {
            values[key] = filterValue(items);
          } else {
            values[key] = items;
          }
        } else {
          if (Array.isArray(items)) {
            values[key] = items.map((item) => item[targetKey]);
          } else if (items && typeof items === 'object') {
            values[key] = items[targetKey];
          } else {
            values[key] = items;
          }
        }
      } else {
        values[key] = form.values[key];
      }
    } else {
      values[key] = form.values[key];
    }
  }
  return values;
}

export const useCreateActionProps = () => {
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { setVisible, fieldSchema } = useActionContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField, getTreeParentField } = useCollection();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const { modal } = App.useApp();

  const currentUser = currentUserContext?.data?.data;
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
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
      // const values = omitBy(formValues, (value) => isEqual(JSON.stringify(value), '[{}]'));
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
};

export const useAssociationCreateActionProps = () => {
  const form = useForm();
  const { field, resource } = useBlockRequestContext();
  const { setVisible, fieldSchema } = useActionContext();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField, getTreeParentField } = useCollection();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
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
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
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
  const { name } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();

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
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  const navigate = useNavigate();
  const compile = useCompile();
  const form = useForm();
  const { modal } = App.useApp();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        skipValidator,
      } = actionSchema?.['x-action-settings'] ?? {};
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
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
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  const navigate = useNavigate();
  const compile = useCompile();
  const { t } = useTranslation();
  const actionField = useField();
  const { modal } = App.useApp();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        updateMode,
      } = actionSchema?.['x-action-settings'] ?? {};
      actionField.data = field.data || {};
      actionField.data.loading = true;
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentUser });
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
          }
        },
        async onCancel() {
          actionField.data.loading = false;
        },
      });
    },
  };
};

export const useCustomizeBulkEditActionProps = () => {
  const form = useForm();
  const { t } = useTranslation();
  const { field, resource, __parent } = useBlockRequestContext();
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
      const { filter } = __parent.service.params?.[0] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = cloneDeep(form.values);
      actionField.data = field.data || {};
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
        if (!(resource instanceof TableFieldResource)) {
          __parent?.__parent?.service?.refresh?.();
        }
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
      } finally {
        actionField.data.loading = false;
      }
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
  const { fields, getField } = useCollection();
  const { field, resource, __parent, service } = useBlockRequestContext();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  const actionField = useField();
  const { setVisible } = useActionContext();
  const { modal } = App.useApp();

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

export const useUpdateActionProps = () => {
  const form = useForm();
  const filterByTk = useFilterByTk();
  const { field, resource, __parent, service } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const actionSchema = useFieldSchema();
  const navigate = useNavigate();
  const { fields, getField } = useCollection();
  const compile = useCompile();
  const actionField = useField();
  const { updateAssociationValues } = useFormBlockContext();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const { modal } = App.useApp();

  const currentUser = currentUserContext?.data?.data;
  const data = useParamsFromRecord();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const fieldNames = fields.map((field) => field.name);
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
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
      div.ant-formily-layout>div:first-child {
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
  const valueKey = collectionField?.targetKey || 'id';
  const labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;
  const field = useField();
  const collectionFieldName = collectionField.name;
  const { data, params, run } = useRequest<{
    data: { [key: string]: any }[];
  }>(
    {
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
  const { currentFields = [] } = useCollection();

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

  let list, handleSearchInput, params, run, data, valueKey, labelKey, filterKey;

  valueKey = collectionField?.targetKey || 'id';
  labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  // eslint-disable-next-line prefer-const
  ({ data, params, run } = useRequest<{
    data: { [key: string]: any }[];
  }>(
    {
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

export const useAssociationNames = () => {
  const { getCollectionJoinField, getCollection } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const updateAssociationValues = new Set([]);
  const appends = new Set([]);
  const getAssociationAppends = (schema, str) => {
    schema.reduceProperties((pre, s) => {
      const prefix = pre || str;
      const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
      const isAssociationSubfield = s.name.includes('.');
      const isAssociationField =
        collectionfield && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionfield.type);
      const isTreeCollection = isAssociationField && getCollection(collectionfield.target)?.template === 'tree';
      if (collectionfield && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
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
          getAssociationAppends(s, bufPrefix);
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
        getAssociationAppends(s, str);
      }
    }, str);
  };
  getAssociationAppends(fieldSchema, '');
  return { appends: [...appends], updateAssociationValues: [...updateAssociationValues] };
};
