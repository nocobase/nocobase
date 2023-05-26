import { Schema, SchemaExpressionScopeContext, useField, useFieldSchema, useForm } from '@formily/react';
import { parse } from '@nocobase/utils/client';
import { Modal, message } from 'antd';
import { cloneDeep, uniq } from 'lodash';
import get from 'lodash/get';
import omit from 'lodash/omit';
import { ChangeEvent, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { AssociationFilter, useFormBlockContext, useTableBlockContext } from '../..';
import { useAPIClient, useRequest } from '../../api-client';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { useFilterBlock } from '../../filter-provider/FilterProvider';
import { transformToFilter } from '../../filter-provider/utils';
import { useRecord } from '../../record-provider';
import { removeNullCondition, useActionContext, useCompile } from '../../schema-component';
import { BulkEditFormItemValueType } from '../../schema-initializer/components';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useCurrentUserContext } from '../../user';
import { useBlockRequestContext, useFilterByTk } from '../BlockProvider';
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

function isURL(string) {
  let url;

  try {
    url = new URL(string);
  } catch (e) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
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
  console.log('form.values', form.values);
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
  const history = useHistory();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField, getTreeParentField } = useCollection();
  const compile = useCompile();
  const filterByTk = useFilterByTk();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
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
        const data = await resource.create({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
        });
        actionField.data.loading = false;
        actionField.data.data = data;
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          Modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  history.push(onSuccess.redirectTo);
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
  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
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
        const data = await resource.create({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
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
  const history = useHistory();
  const compile = useCompile();
  const form = useForm();

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
        Modal.success({
          title: compile(onSuccess?.successMessage),
          onOk: async () => {
            if (onSuccess?.redirecting && onSuccess?.redirectTo) {
              if (isURL(onSuccess.redirectTo)) {
                window.location.href = onSuccess.redirectTo;
              } else {
                history.push(onSuccess.redirectTo);
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
  const history = useHistory();
  const compile = useCompile();
  const { t } = useTranslation();
  const actionField = useField();

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
      Modal.confirm({
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
            Modal.success({
              title: compile(onSuccess?.successMessage),
              onOk: async () => {
                if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                  if (isURL(onSuccess.redirectTo)) {
                    window.location.href = onSuccess.redirectTo;
                  } else {
                    history.push(onSuccess.redirectTo);
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
  const history = useHistory();
  const compile = useCompile();
  const actionField = useField();
  const tableBlockContext = useTableBlockContext();
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
          Modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  history.push(onSuccess.redirectTo);
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
  const history = useHistory();
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
          Modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  history.push(onSuccess.redirectTo);
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
  const history = useHistory();
  const { fields, getField } = useCollection();
  const compile = useCompile();
  const actionField = useField();
  const { updateAssociationValues } = useFormBlockContext();
  const currentRecord = useRecord();
  const currentUserContext = useCurrentUserContext();
  const currentUser = currentUserContext?.data?.data;
  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
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
          updateAssociationValues,
        });
        actionField.data.loading = false;
        __parent?.service?.refresh?.();
        setVisible?.(false);
        if (!onSuccess?.successMessage) {
          return;
        }
        if (onSuccess?.manualClose) {
          Modal.success({
            title: compile(onSuccess?.successMessage),
            onOk: async () => {
              await form.reset();
              if (onSuccess?.redirecting && onSuccess?.redirectTo) {
                if (isURL(onSuccess.redirectTo)) {
                  window.location.href = onSuccess.redirectTo;
                } else {
                  history.push(onSuccess.redirectTo);
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
  return {
    async onClick() {
      await resource.destroy({
        filterByTk,
      });

      const { count = 0, page = 0, pageSize = 0 } = service?.data?.meta || {};
      if (count % pageSize === 1) {
        service.run({
          ...service?.params?.[0],
          page: page - 1,
        });
      } else {
        service?.refresh?.();
      }

      if (block !== 'TableField') {
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
  const { data, params, run } = useRequest(
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
  const collectionFieldName = collectionField.name;
  const field = useField();

  let list, onSelected, handleSearchInput, params, run, data, valueKey, labelKey, filterKey;

  valueKey = collectionField?.targetKey || 'id';
  labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  ({ data, params, run } = useRequest(
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

  onSelected = (value) => {
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

const getTemplateSchema = (schema) => {
  const conf = {
    url: `/uiSchemas:getJsonSchema/${schema?.uid}`,
  };
  const { data, loading, run } = useRequest(conf, { manual: true });
  if (loading) {
  }
  useEffect(() => {
    if (schema?.uid) {
      run();
    }
  }, [schema?.uid]);
  return schema?.uid ? new Schema(data?.data) : null;
};

export const useAssociationNames = (collection) => {
  const { getCollectionJoinField } = useCollectionManager();
  const { getTemplateById } = useSchemaTemplateManager();
  const fieldSchema = useFieldSchema();
  const associationValues = [];
  const formSchema = fieldSchema.reduceProperties((buf, schema) => {
    if (['FormV2', 'Details', 'List', 'GridCard'].includes(schema['x-component'])) {
      return schema;
    }
    return buf;
  }, new Schema({}));

  const templateSchema = formSchema.reduceProperties((buf, schema) => {
    if (schema['x-component'] === 'BlockTemplate') {
      return schema;
    }
    return buf;
  }, null);

  const getAssociationAppends = (schema, arr = []) => {
    const data = schema.reduceProperties((buf, s) => {
      const collectionfield = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field']);
      if (
        collectionfield &&
        ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(collectionfield.type) &&
        s['x-component'] !== 'TableField'
      ) {
        buf.push(s.name);
        if (['Nester', 'SubTable'].includes(s['x-component-props']?.mode)) {
          associationValues.push(s.name);
        }
        if (s['x-component-props'].mode === 'Nester') {
          return getAssociationAppends(s, buf);
        }
        return buf;
      } else {
        if (s['x-component'] === 'Grid.Row') {
          const kk = buf?.concat?.();
          return getNesterAppends(s, kk || []);
        } else {
          return !s['x-component']?.includes('Action.') && s['x-component'] !== 'TableField'
            ? getAssociationAppends(s, buf)
            : buf;
        }
      }
    }, arr);
    return data || [];
  };

  function flattenNestedList(nestedList) {
    const flattenedList = [];
    function flattenHelper(list, prefix) {
      for (let i = 0; i < list.length; i++) {
        if (Array.isArray(list[i])) {
          `${prefix}` !== `${list[i][0]}` && flattenHelper(list[i], `${prefix}.${list[i][0]}`);
        } else {
          const searchTerm = `.${list[i]}`;
          const lastIndex = prefix.lastIndexOf(searchTerm);
          let str = '';
          if (lastIndex !== -1) {
            str = prefix.slice(0, lastIndex) + prefix.slice(lastIndex + searchTerm.length);
          }
          if (!str) {
            !list.includes(str) && flattenedList.push(`${list[i]}`);
          } else {
            !list.includes(str) ? flattenedList.push(`${str}.${list[i]}`) : flattenedList.push(str);
          }
        }
      }
    }
    for (let i = 0; i < nestedList.length; i++) {
      flattenHelper(nestedList[i], nestedList[i][0]);
    }
    return uniq(flattenedList.filter((obj) => !obj?.startsWith('.')));
  }
  const getNesterAppends = (gridSchema, data) => {
    gridSchema.reduceProperties((buf, s) => {
      buf.push(getAssociationAppends(s));
      return buf;
    }, data);
    return data.filter((g) => g.length);
  };

  const template = getTemplateById(templateSchema?.['x-component-props']?.templateId);
  const schema = getTemplateSchema(template);
  if (schema) {
    const associations = getAssociationAppends(schema);
    const appends = flattenNestedList(associations);
    return {
      appends,
      updateAssociationValues: appends.filter((item) => associationValues.some((suffix) => item.endsWith(suffix))),
    };
  }
  if (!schema) {
    const associations = getAssociationAppends(formSchema);
    const appends = flattenNestedList(associations);
    return {
      appends,
      updateAssociationValues: appends.filter((item) => associationValues.some((suffix) => item.endsWith(suffix))),
    };
  }
};
