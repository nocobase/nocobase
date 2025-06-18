/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Field, Form } from '@formily/core';
import { SchemaExpressionScopeContext, useField, useFieldSchema, useForm } from '@formily/react';
import { untracked } from '@formily/reactive';
import { evaluators } from '@nocobase/evaluators/client';
import { isURL, parse } from '@nocobase/utils/client';
import { App, message } from 'antd';
import _ from 'lodash';
import get from 'lodash/get';
import omit from 'lodash/omit';
import qs from 'qs';
import { ChangeEvent, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigateFunction } from 'react-router-dom';
import {
  AssociationFilter,
  useCollection,
  useCollectionManager,
  useCollectionRecord,
  useDataSourceHeaders,
  useFormActiveFields,
  useParsedFilter,
  useRouterBasename,
  useTableBlockContext,
} from '../..';
import { useAPIClient, useRequest } from '../../api-client';
import { useNavigateNoUpdate } from '../../application/CustomRouterContextProvider';
import { useFormBlockContext } from '../../block-provider/FormBlockProvider';
import { CollectionOptions, useCollectionManager_deprecated, useCollection_deprecated } from '../../collection-manager';
import { getVariableValue } from '../../common/getVariableValue';
import { DataBlock, useFilterBlock } from '../../filter-provider/FilterProvider';
import { mergeFilter, transformToFilter } from '../../filter-provider/utils';
import { useTreeParentRecord } from '../../modules/blocks/data-blocks/table/TreeRecordProvider';
import { useRecord } from '../../record-provider';
import { removeNullCondition, useActionContext, useCompile } from '../../schema-component';
import { isSubMode } from '../../schema-component/antd/association-field/util';
import { replaceVariables } from '../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { useCurrentUserContext } from '../../user';
import { useLocalVariables, useVariables } from '../../variables';
import { VariableOption, VariablesContextType } from '../../variables/types';
import { isVariable } from '../../variables/utils/isVariable';
import { transformVariableValue } from '../../variables/utils/transformVariableValue';
import { useBlockRequestContext, useFilterByTk, useParamsFromRecord } from '../BlockProvider';
import { useOperators } from '../CollectOperators';
import { useDetailsBlockContext } from '../DetailsBlockProvider';
import { TableFieldResource } from '../TableFieldProvider';

export * from './useBlockHeightProps';
export * from './useDataBlockParentRecord';
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

function getFilteredFormValues(form) {
  const values = _.cloneDeep(form.values);
  const allFields = [];
  form.query('*').forEach((field) => {
    if (field) {
      allFields.push(field);
    }
  });
  const readonlyPaths = _.uniq(
    allFields
      .filter((field) => {
        const segments = field.path?.segments || [];
        const path = segments.length <= 1 ? segments.join('.') : segments.slice(0, -1).join('.');
        return field?.componentProps?.readOnlySubmit && !get(values, path)[field?.componentProps.filterTargetKey];
      })
      .map((field) => {
        const segments = field.path?.segments || [];
        if (segments.length <= 1) {
          return segments.join('.');
        }
        return segments.slice(0, -1).join('.');
      }),
  );
  readonlyPaths.forEach((path, index) => {
    if ((index !== 0 || path.includes('.')) && !values[path]) {
      // 清空值，但跳过第一层
      _.unset(values, path);
    }
  });
  return values;
}

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

  return getFilteredFormValues(form);
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
  const treeParentRecord = useTreeParentRecord();

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
        const { value: parsedValue } = (await variables?.parseVariable(value, localVariables)) || {};
        assignedValues[key] = transformVariableValue(parsedValue, { targetCollectionField: collectionField });
      } else if (value !== '') {
        assignedValues[key] = value;
      }
    });
    await Promise.all(waitList);
    // const values = omitBy(formValues, (value) => isEqual(JSON.stringify(value), '[{}]'));
    const addChild = fieldSchema?.['x-component-props']?.addChild;
    if (addChild) {
      const treeParentField = getTreeParentField();
      values[treeParentField?.name ?? 'parent'] = treeParentRecord;
      values[treeParentField?.foreignKey ?? 'parentId'] = treeParentRecord?.id;
    }

    return {
      ...values,
      ...overwriteValues,
      ...assignedValues,
    };
  }, [
    actionSchema,
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
    treeParentRecord,
    variables,
  ]);
}

export const useCreateActionProps = () => {
  const filterByTk = useFilterByTk();
  const record = useCollectionRecord();
  const form = useForm();
  const { field, resource } = useBlockRequestContext();
  const { setVisible, setSubmitted, setFormValueChanged } = useActionContext();
  const navigate = useNavigateNoUpdate();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const compile = useCompile();
  const { modal } = App.useApp();
  const { t } = useTranslation();
  const { updateAssociationValues } = useFormBlockContext();
  const collectValues = useCollectValuesToSubmit();
  const action = record.isNew ? actionField.componentProps.saveMode || 'create' : 'update';
  const filterKeys = actionField.componentProps.filterKeys?.checked || [];
  const localVariables = useLocalVariables();
  const variables = useVariables();

  return {
    async onClick() {
      const { onSuccess, skipValidator, triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};

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
        let redirectTo = rawRedirectTo;
        if (rawRedirectTo) {
          redirectTo = await getVariableValue(rawRedirectTo, {
            variables,
            localVariables: [...localVariables, { name: '$record', ctx: new Proxy(data?.data?.data, {}) }],
          });
        }

        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        setSubmitted?.(true);
        setFormValueChanged?.(false);
        actionField.data.loading = false;
        actionField.data.data = data;
        // __parent?.service?.refresh?.();
        if (!successMessage) {
          message.success(t('Saved successfully'));
          await resetFormCorrectly(form);
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
              await resetFormCorrectly(form);
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
          await resetFormCorrectly(form);
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
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
  const { setVisible, fieldSchema, setSubmitted } = useActionContext();
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
      const { successMessage } = onSuccess || {};
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
          const { value: parsedValue } = (await variables?.parseVariable(value, localVariables)) || {};
          assignedValues[key] = transformVariableValue(parsedValue, { targetCollectionField: collectionField });
        } else if (value !== '') {
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
        setSubmitted?.(true);
        if (!successMessage) {
          return;
        }
        message.success(compile(successMessage));
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
  /**
   * 筛选表单区块的 uid
   */
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

/**
 * 注意：因为筛选表单的字段有可能设置的有默认值，所以筛选表单的筛选操作会在首次渲染时自动执行一次，
 * 以确保数据区块中首次显示的数据与筛选表单的筛选条件匹配。
 * @returns
 */
const useDoFilter = () => {
  const form = useForm();
  const { getDataBlocks } = useFilterBlock();
  const cm = useCollectionManager();
  const { getOperators } = useOperators();
  const fieldSchema = useFieldSchema();
  const { name } = useCollection();
  const { targets = [], uid } = useMemo(() => findFilterTargets(fieldSchema), [fieldSchema]);
  const getFilterFromCurrentForm = useCallback(() => {
    return removeNullCondition(transformToFilter(form.values, getOperators(), cm.getCollectionField.bind(cm), name));
  }, [form.values, cm, getOperators, name]);

  const doFilter = useCallback(
    async ({ doNothingWhenFilterIsEmpty = false } = {}) => {
      try {
        // 收集 filter 的值
        await Promise.all(
          getDataBlocks().map(async (block) => {
            const target = targets.find((target) => target.uid === block.uid);
            if (!target) return;

            const param = block.service.params?.[0] || {};
            // 保留原有的 filter
            const storedFilter = block.service.params?.[1]?.filters || {};

            // 由当前表单转换而来的 filter
            storedFilter[uid] = getFilterFromCurrentForm();
            const mergedFilter = mergeFilter([
              ...Object.values(storedFilter).map((filter) => removeNullCondition(filter)),
              block.defaultFilter,
            ]);

            if (_.isEmpty(storedFilter[uid])) {
              block.clearSelection?.();
            }

            if (doNothingWhenFilterIsEmpty && _.isEmpty(storedFilter[uid])) {
              return;
            }

            if (block.dataLoadingMode === 'manual' && _.isEmpty(storedFilter[uid])) {
              return block.clearData();
            }

            // 存储当前的筛选条件，供其它筛选区块使用
            _.set(block.service.params, '1.filters', storedFilter);
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
      } catch (error) {
        console.error(error);
      }
    },
    [getDataBlocks, getFilterFromCurrentForm, targets, uid],
  );

  // 这里的代码是为了实现：筛选表单的筛选操作在首次渲染时自动执行一次
  useEffect(() => {
    // 使用 setTimeout 是为了等待筛选表单的变量解析完成，否则会因为获取的 filter 为空而导致筛选表单的筛选操作不执行。
    // 另外，如果不加 100 毫秒的延迟，会导致数据区块列表更新后，不触发筛选操作的问题。
    setTimeout(() => {
      doFilter({ doNothingWhenFilterIsEmpty: true });
    }, 500);
  }, [doFilter]);

  return {
    /**
     * 用于执行筛选表单的筛选操作
     */
    doFilter,
    /**
     * 根据当前表单的值获取 filter
     */
    getFilterFromCurrentForm,
  };
};

export const useFilterBlockActionProps = () => {
  const { doFilter } = useDoFilter();
  const actionField = useField();
  actionField.data = actionField.data || {};

  return {
    async onClick() {
      actionField.data.loading = true;
      await doFilter();
      actionField.data.loading = false;
    },
  };
};

const useDoReset = () => {
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { getDataBlocks } = useFilterBlock();
  const { targets, uid } = findFilterTargets(fieldSchema);
  const { doFilter, getFilterFromCurrentForm } = useDoFilter();

  return {
    doReset: async () => {
      await form.reset(undefined, {
        forceClear: !!fieldSchema?.['x-component-props']?.clearDefaultValue,
      });
      if (_.isEmpty(getFilterFromCurrentForm())) {
        return doReset({ getDataBlocks, targets, uid });
      }
      await doFilter();
    },
  };
};

export const useResetBlockActionProps = () => {
  const actionField = useField();
  const { doReset } = useDoReset();

  actionField.data = actionField.data || {};

  return {
    async onClick() {
      actionField.data.loading = true;
      await doReset();
      actionField.data.loading = false;
    },
  };
};

export const useCustomizeUpdateActionProps = () => {
  const { resource, __parent, service } = useBlockRequestContext();
  const filterByTk = useFilterByTk();
  const actionSchema = useFieldSchema();
  const navigate = useNavigateNoUpdate();
  const compile = useCompile();
  const form = useForm();
  const { modal } = App.useApp();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const { name, getField } = useCollection_deprecated();
  const { setVisible } = useActionContext();

  return {
    async onClick(e?, callBack?) {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};
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
          const { value: parsedValue } = (await variables?.parseVariable(value, localVariables)) || {};
          assignedValues[key] = transformVariableValue(parsedValue, { targetCollectionField: collectionField });
        } else if (value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);

      if (skipValidator === false) {
        await form.submit();
      }
      const result = await resource.update({
        filterByTk,
        values: { ...assignedValues },
        // TODO(refactor): should change to inject by plugin
        triggerWorkflows: triggerWorkflows?.length
          ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
          : undefined,
      });

      let redirectTo = rawRedirectTo;
      if (rawRedirectTo) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        redirectTo = await getVariableValue(rawRedirectTo, {
          variables,
          localVariables: [...localVariables, { name: '$record', ctx: new Proxy(result?.data?.data, {}) }],
        });
      }

      if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
        setVisible?.(false);
      }
      // service?.refresh?.();
      if (callBack) {
        callBack?.();
      }
      if (!(resource instanceof TableFieldResource)) {
        __parent?.service?.refresh?.();
      }
      if (!successMessage) {
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
  const navigate = useNavigateNoUpdate();
  const compile = useCompile();
  const { t } = useTranslation();
  const actionField = useField();
  const { modal } = App.useApp();
  const variables = useVariables();
  const record = useRecord();
  const { name, getField } = useCollection_deprecated();
  const localVariables = useLocalVariables();
  const { setVisible } = useActionContext();

  return {
    async onClick() {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        updateMode,
      } = actionSchema?.['x-action-settings'] ?? {};
      const { manualClose, redirecting, redirectTo, successMessage, actionAfterSuccess } = onSuccess || {};
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
          const { value: parsedValue } = (await variables?.parseVariable(value, localVariables)) || {};
          assignedValues[key] = transformVariableValue(parsedValue, { targetCollectionField: collectionField });
        } else if (value !== '') {
          assignedValues[key] = value;
        }
      });
      await Promise.all(waitList);
      if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
        setVisible?.(false);
      }
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
          // service?.refresh?.();
          if (!(resource instanceof TableFieldResource)) {
            __parent?.service?.refresh?.();
          }
          if (!successMessage) {
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
  const navigate = useNavigateNoUpdate();
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
  const { t } = useTranslation();
  const { setVisible } = useActionContext();
  const { modal } = App.useApp();
  const { getActiveFieldsName } = useFormActiveFields() || {};

  return {
    async onClick() {
      const { skipValidator, onSuccess, requestSettings } = actionSchema?.['x-action-settings'] ?? {};
      const { manualClose, redirecting, redirectTo, successMessage, actionAfterSuccess } = onSuccess || {};
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
          if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
            setVisible?.(false);
          }
        }
        if (!successMessage) {
          message.success(t('Saved successfully'));
          await resetFormCorrectly(form);
          if (((redirecting && !actionAfterSuccess) || actionAfterSuccess === 'redirect') && redirectTo) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
            }
          }
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
  const { setVisible, setFormValueChanged } = useActionContext();
  const actionSchema = useFieldSchema();
  const navigate = useNavigateNoUpdate();
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
    async onClick(e?, callBack?) {
      const {
        assignedValues: originalAssignedValues = {},
        onSuccess,
        overwriteValues,
        skipValidator,
        triggerWorkflows,
      } = actionSchema?.['x-action-settings'] ?? {};
      const {
        manualClose,
        redirecting,
        redirectTo: rawRedirectTo,
        successMessage,
        actionAfterSuccess,
      } = onSuccess || {};
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
          const { value: parsedValue } = (await variables?.parseVariable(value, localVariables)) || {};
          assignedValues[key] = transformVariableValue(parsedValue, { targetCollectionField: collectionField });
        } else if (value !== '') {
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
        const result = await resource.update({
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
        // __parent?.service?.refresh?.();
        if (callBack) {
          callBack?.();
        }
        let redirectTo = rawRedirectTo;
        if (rawRedirectTo) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          redirectTo = await getVariableValue(rawRedirectTo, {
            variables,
            localVariables: [...localVariables, { name: '$record', ctx: new Proxy(result?.data?.data, {}) }],
          });
        }

        if (actionAfterSuccess === 'previous' || (!actionAfterSuccess && redirecting !== true)) {
          setVisible?.(false);
        }
        setFormValueChanged?.(false);
        if (!successMessage) {
          return;
        }
        if (manualClose) {
          modal.success({
            title: compile(successMessage),
            onOk: async () => {
              await form.reset();
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
          if (
            ((redirecting && !actionAfterSuccess) ||
              actionAfterSuccess === 'redirect' ||
              actionAfterSuccess === 'redirect') &&
            redirectTo
          ) {
            if (isURL(redirectTo)) {
              window.location.href = redirectTo;
            } else {
              navigate(redirectTo);
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
  const { setVisible, setSubmitted } = useActionContext();
  const data = useParamsFromRecord();
  const actionSchema = useFieldSchema();
  return {
    async onClick(e?, callBack?) {
      const { triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      await resource.destroy({
        filterByTk,
        // TODO(refactor): should change to inject by plugin
        triggerWorkflows: triggerWorkflows?.length
          ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
          : undefined,
        ...data,
      });

      const { count = 0, page = 0, pageSize = 0 } = service?.data?.meta || {};
      if (count % pageSize === 1 && page !== 1) {
        const currentPage = service.params[0]?.page;
        const totalPage = service.data?.meta?.totalPage;
        if (currentPage === totalPage && service.params[0] && currentPage !== 1) {
          service.params[0].page = currentPage - 1;
        }
      }
      if (callBack) {
        callBack?.();
      }
      //  else {
      //   service?.refresh?.();
      // }
      setSubmitted?.(true);
      if (block && block !== 'TableField') {
        __parent?.service?.refresh?.();
        setVisible?.(false);
        setSubmitted?.(true);
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

export const useDisassociateActionProps = () => {
  const filterByTk = useFilterByTk();
  const { resource, service, block, __parent } = useBlockRequestContext();
  const { setVisible, setSubmitted, setFormValueChanged } = useActionContext();
  return {
    async onClick(e?, callBack?) {
      await resource.remove({
        values: [filterByTk],
      });

      const { count = 0, page = 0, pageSize = 0 } = service?.data?.meta || {};
      if (count % pageSize === 1 && page !== 1) {
        service.run({
          ...service?.params?.[0],
          page: page - 1,
        });
      } else {
        if (callBack) {
          callBack?.();
        }
      }
      setSubmitted?.(true);
      if (block && block !== 'TableField') {
        __parent?.service?.refresh?.();
        setVisible?.(false);
        setFormValueChanged?.(false);
      }
    },
  };
};

export const useBulkDestroyActionProps = () => {
  const { field } = useBlockRequestContext();
  const { resource, service } = useBlockRequestContext();
  const { setSubmitted } = useActionContext();
  const collection = useCollection_deprecated();
  const { filterTargetKey } = collection;
  return {
    async onClick(e?, callBack?) {
      let filterByTk = field.data?.selectedRowKeys;
      if (Array.isArray(filterTargetKey)) {
        filterByTk = field.data.selectedRowData.map((v) => {
          const obj = {};
          filterTargetKey.map((j) => {
            obj[j] = v[j];
          });
          return obj;
        });
      }
      if (!field?.data?.selectedRowKeys?.length) {
        return;
      }
      await resource.destroy({
        filterByTk,
      });
      field.data.selectedRowKeys = [];
      const currentPage = service.params[0]?.page;
      const totalPage = service.data?.meta?.totalPage;
      if (currentPage === totalPage && service.params[0] && currentPage !== 1) {
        service.params[0].page = currentPage - 1;
      }
      if (callBack) {
        callBack?.();
      }
      setSubmitted?.(true);
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
  const current = ctx.service?.data?.meta?.page;
  if (!count && current) {
    return {
      simple: true,
      current: ctx.service?.data?.meta?.page || 1,
      pageSize: 1,
      showSizeChanger: false,
      align: 'center',
      async onChange(page) {
        const params = ctx.service?.params?.[0];
        ctx.service.run({ ...params, page });
      },
      style: {
        marginTop: 24,
        textAlign: 'center',
      },
      showTotal: false,
      showTitle: false,
      total: ctx.service?.data?.data?.length ? 1 * current + 1 : 1 * current,
      className: css`
        .ant-pagination-simple-pager {
          display: none !important;
        }
      `,
    };
  }
  return {
    simple: true,
    hidden: count <= 1,
    current: ctx.service?.data?.meta?.page || 1,
    total: count,
    pageSize: 1,
    showSizeChanger: false,
    align: 'center',
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

  return currentFields.filter((field) => isOptionalField(field));
};

const isOptionalField = (field) => {
  const optionalInterfaces = ['select', 'multipleSelect', 'checkbox', 'checkboxGroup', 'chinaRegion'];
  return optionalInterfaces.includes(field?.interface) && field?.uiSchema?.enum;
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
  const cm = useCollectionManager();
  const { filter, parseVariableLoading } = useParsedFilter({ filterOption: field.componentProps?.params?.filter });

  let list, handleSearchInput, params, run, data, valueKey, labelKey, filterKey;

  valueKey = collectionField?.target ? cm?.getCollection(collectionField.target)?.getPrimaryKey() : 'id';
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
        filter,
      },
    },
    {
      // 由于选项字段不需要触发当前请求，所以当前请求更改为手动触发
      manual: true,
      debounceWait: 300,
    },
  ));

  useEffect(() => {
    // 由于选项字段不需要触发当前请求，所以请求单独在关系字段的时候触发
    if (collectionField && !isOptionalField(collectionField) && parseVariableLoading === false) {
      run();
    }

    // do not format the dependencies
  }, [
    collectionField,
    labelKey,
    run,
    valueKey,
    field.componentProps?.params,
    field.componentProps?.params?.sort,
    parseVariableLoading,
  ]);

  const onSelected = useCallback(
    (value) => {
      const { targets, uid } = findFilterTargets(fieldSchema);

      getDataBlocks().forEach((block) => {
        const target = targets.find((target) => target.uid === block.uid);
        if (!target) return;

        const key = `${uid}${fieldSchema.name}`;
        const param = block.service.params?.[0] || {};

        if (!block.service.params?.[1]?.filters) {
          _.set(block.service.params, '[1].filters', {});
        }

        // 保留原有的 filter
        const storedFilter = block.service.params[1].filters;

        if (value.length) {
          storedFilter[key] = {
            [filterKey]: value,
          };
        } else {
          block.clearSelection?.();
          if (block.dataLoadingMode === 'manual') {
            return block.clearData();
          }
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
    },
    [fieldSchema, filterKey, getDataBlocks],
  );

  if (!collectionField) {
    return {};
  }

  if (isOptionalField(collectionField)) {
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

  return {
    /** 渲染 Collapse 的列表数据 */
    list,
    onSelected,
    handleSearchInput,
    params,
    run,
    valueKey,
    labelKey,
    dataScopeFilter: filter,
  };
};
async function doReset({
  getDataBlocks,
  targets,
  uid,
}: {
  getDataBlocks: () => DataBlock[];
  targets: {
    /** field uid */
    uid: string;
    /** associated field */
    field?: string;
  }[];
  uid: string;
}) {
  try {
    await Promise.all(
      getDataBlocks().map(async (block) => {
        const target = targets.find((target) => target.uid === block.uid);
        if (!target) return;

        block.clearSelection?.();

        if (block.dataLoadingMode === 'manual') {
          return block.clearData();
        }

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
  } catch (error) {
    console.error(error);
  }
}

export function getAssociationPath(str) {
  const lastIndex = str.lastIndexOf('.');
  if (lastIndex !== -1) {
    return str.substring(0, lastIndex);
  }
  return str;
}

export const getAppends = ({
  schema,
  prefix: defaultPrefix,
  updateAssociationValues,
  appends,
  getCollectionJoinField,
  getCollection,
  dataSource,
}: {
  schema: any;
  prefix: string;
  updateAssociationValues: Set<string>;
  appends: Set<string>;
  getCollectionJoinField: (name: string, dataSource: string) => any;
  getCollection: (name: any, customDataSource?: string) => CollectionOptions;
  dataSource: string;
}) => {
  schema.reduceProperties((pre, s) => {
    const prefix = pre || defaultPrefix;
    const collectionField = s['x-collection-field'] && getCollectionJoinField(s['x-collection-field'], dataSource);
    const isAssociationSubfield = s.name.includes('.');
    const isAssociationField =
      collectionField &&
      ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(collectionField.type);

    // 根据联动规则中条件的字段获取一些 appends
    // 需要排除掉子表格和子表单中的联动规则
    if (s['x-linkage-rules'] && !isSubMode(s)) {
      const collectAppends = (obj) => {
        const type = Object.keys(obj)[0] || '$and';
        const list = obj[type];

        list.forEach((item) => {
          if ('$and' in item || '$or' in item) {
            return collectAppends(item);
          }

          const fieldNames = getTargetField(item);

          // 只应该收集关系字段，只有大于 1 的时候才是关系字段
          if (fieldNames.length > 1 && !item.op) {
            appends.add(fieldNames.join('.'));
          }
        });
      };

      const rules = s['x-linkage-rules'];
      rules.forEach(({ condition }) => {
        collectAppends(condition);
      });
    }

    const isTreeCollection =
      isAssociationField && getCollection(collectionField.target, dataSource)?.template === 'tree';

    if (collectionField && (isAssociationField || isAssociationSubfield) && s['x-component'] !== 'TableField') {
      const fieldPath = !isAssociationField && isAssociationSubfield ? getAssociationPath(s.name) : s.name;
      const path = prefix === '' || !prefix ? fieldPath : prefix + '.' + fieldPath;
      if (isTreeCollection) {
        appends.add(path);
        appends.add(`${path}.parent` + '(recursively=true)');
      } else {
        if (s['x-component-props']?.sortArr) {
          const sort = s['x-component-props']?.sortArr;
          appends.add(`${path}(sort=${sort})`);
        } else {
          appends.add(path);
        }
      }
      if (isSubMode(s)) {
        updateAssociationValues.add(path);
        const bufPrefix = prefix && prefix !== '' ? prefix + '.' + s.name : s.name;
        getAppends({
          schema: s,
          prefix: bufPrefix,
          updateAssociationValues,
          appends,
          getCollectionJoinField,
          getCollection,
          dataSource,
        });
      }
    } else if (
      ![
        // 'ActionBar',
        'Action',
        'Action.Link',
        'Action.Modal',
        'Selector',
        'Viewer',
        'AddNewer',
        'AssociationField.Selector',
        'AssociationField.AddNewer',
        'TableField',
        'Kanban.CardViewer',
        'Action.Container',
      ].includes(s['x-component'])
    ) {
      getAppends({
        schema: s,
        prefix: defaultPrefix,
        updateAssociationValues,
        appends,
        getCollectionJoinField,
        getCollection,
        dataSource,
      });
    }
  }, defaultPrefix);
};

export const useAssociationNames = (dataSource?: string) => {
  const { getCollectionJoinField, getCollection } = useCollectionManager_deprecated(dataSource);
  const fieldSchema = useFieldSchema();
  const prevAppends = useRef(null);

  const getAssociationAppends = useCallback(() => {
    const updateAssociationValues = new Set([]);
    let appends = new Set([]);

    getAppends({
      schema: fieldSchema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField,
      getCollection,
      dataSource,
    });
    appends = fillParentFields(appends);

    const newAppends = [...appends];
    const newUpdateAssociationValues = [...updateAssociationValues];

    const result = {
      appends: _.isEqual(prevAppends.current, newAppends) ? prevAppends.current : newAppends,
      // `updateAssociationValues` needs to be recreated each time to ensure test case passes in: core/client/src/modules/blocks/data-blocks/table/__e2e__/schemaSettings.test.ts:886:9
      updateAssociationValues: newUpdateAssociationValues,
    };

    prevAppends.current = result.appends;

    return result;
  }, [dataSource, fieldSchema, getCollection, getCollectionJoinField]);

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

/**
 * 之所以不直接使用 form.reset() 是因为其无法将子表格重置为空
 * 主要用于修复这个问题：https://nocobase.height.app/T-3106
 * @param form
 */
async function resetFormCorrectly(form: Form) {
  untracked(() => {
    Object.keys(form.fields).forEach((key) => {
      if (isSubMode(form.fields[key])) {
        // 清空子表格或者子表单的初始值，可以确保后面的 reset 会清空子表格或者子表单的值
        (form.fields[key] as Field).initialValue = null;
      }
    });
  });
  await form.reset();
}

export function appendQueryStringToUrl(url: string, queryString: string) {
  if (queryString) {
    return url + (url.includes('?') ? '&' : '?') + queryString;
  }
  return url;
}

export const useParseURLAndParams = () => {
  const variables = useVariables();
  const localVariables = useLocalVariables();

  const parseURLAndParams = useCallback(
    async (url: string, params: { name: string; value: any }[]) => {
      const queryString = await parseVariablesAndChangeParamsToQueryString({
        searchParams: params,
        variables,
        localVariables,
        replaceVariableValue,
      });
      const targetUrl = await replaceVariableValue(url, variables, localVariables);
      const result = appendQueryStringToUrl(targetUrl, queryString);

      return result;
    },
    [variables, localVariables],
  );

  return { parseURLAndParams };
};

export function useLinkActionProps(componentProps?: any) {
  const navigate = useNavigateNoUpdate();
  const fieldSchema = useFieldSchema();
  const componentPropsValue = fieldSchema?.['x-component-props'] || componentProps;
  const { t } = useTranslation();
  const url = componentPropsValue?.['url'];
  const searchParams = componentPropsValue?.['params'] || [];
  const type = componentPropsValue?.['type'] || 'default';
  const openInNewWindow = fieldSchema?.['x-component-props']?.['openInNewWindow'];
  const { parseURLAndParams } = useParseURLAndParams();
  const basenameOfCurrentRouter = useRouterBasename();

  return {
    type,
    async onClick() {
      if (!url) {
        message.warning(t('Please configure the URL'));
        return;
      }
      const link = await parseURLAndParams(url, searchParams);

      if (link) {
        if (openInNewWindow) {
          window.open(completeURL(link), '_blank');
        } else {
          navigateWithinSelf(link, navigate, window.location.origin + basenameOfCurrentRouter);
        }
      } else {
        console.error('link should be a string');
      }
    },
  };
}

export async function replaceVariableValue(
  url: string,
  variables: VariablesContextType,
  localVariables: VariableOption[],
) {
  if (!url) {
    return;
  }
  const { evaluate } = evaluators.get('string');
  // 解析如 `{{$user.name}}` 之类的变量
  const { exp, scope: expScope } = await replaceVariables(url, {
    variables,
    localVariables,
  });

  try {
    const result = evaluate(exp, { now: () => new Date().toString(), ...expScope });
    return result;
  } catch (error) {
    console.error(error);
  }
}

export async function parseVariablesAndChangeParamsToQueryString({
  searchParams,
  variables,
  localVariables,
  replaceVariableValue,
}: {
  searchParams: { name: string; value: any }[];
  variables: VariablesContextType;
  localVariables: VariableOption[];
  replaceVariableValue: (
    url: string,
    variables: VariablesContextType,
    localVariables: VariableOption[],
  ) => Promise<any>;
}) {
  const parsed = await Promise.all(
    searchParams.map(async ({ name, value }) => {
      if (typeof value === 'string') {
        if (isVariable(value)) {
          const { value: parsedValue } = (await variables.parseVariable(value, localVariables)) || {};
          return { name, value: parsedValue };
        }
        const result = await replaceVariableValue(value, variables, localVariables);
        return { name, value: result };
      }
      return { name, value };
    }),
  );

  const params = {};

  for (const { name, value } of parsed) {
    if (name && value) {
      params[name] = reduceValueSize(value);
    }
  }

  return qs.stringify(params);
}

/**
 * 1. 去除 value 是一个对象或者数组的 key
 * 2. 去除 value 是一个字符串长度超过 100 个字符的 key
 */
export function reduceValueSize(value: any) {
  if (_.isPlainObject(value)) {
    const result = {};
    Object.keys(value).forEach((key) => {
      if (_.isPlainObject(value[key]) || _.isArray(value[key])) {
        return;
      }
      if (_.isString(value[key]) && value[key].length > 100) {
        return;
      }
      result[key] = value[key];
    });
    return result;
  }

  if (_.isArray(value)) {
    return value.map((item) => {
      if (_.isPlainObject(item) || _.isArray(item)) {
        return reduceValueSize(item);
      }
      return item;
    });
  }

  return value;
}

// 补全 URL
export function completeURL(url: string, origin = window.location.origin) {
  if (!url) {
    return '';
  }
  if (isURL(url)) {
    return url;
  }
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

export function navigateWithinSelf(link: string, navigate: NavigateFunction, basePath = window.location.origin) {
  if (!_.isString(link)) {
    return console.error('link should be a string');
  }

  if (isURL(link)) {
    if (link.startsWith(basePath)) {
      navigate(completeURL(link.replace(basePath, ''), ''));
    } else {
      window.open(link, '_self');
    }
  } else {
    navigate(completeURL(link, ''));
  }
}

/**
 * 为多层级的关系字段补充上父级字段
 * e.g. ['a', 'b.c'] => ['a', 'b', 'b.c']
 * @param appends
 * @returns
 */
export function fillParentFields(appends: Set<string>) {
  const depFields = Array.from(appends).filter((field) => field.includes('.'));

  depFields.forEach((field) => {
    const fields = field.split('.');
    fields.pop();
    const parentField = fields.join('.');
    appends.add(parentField);
  });

  return appends;
}
