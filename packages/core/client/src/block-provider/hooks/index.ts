import { useField, useFieldSchema, useForm } from '@formily/react';
import { message, Modal } from 'antd';
import parse from 'json-templates';
import get from 'lodash/get';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useFormBlockContext } from '../..';
import { useAPIClient } from '../../api-client';
import { useCollection } from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { useActionContext, useCompile } from '../../schema-component';
import { useCurrentUserContext } from '../../user';
import { useBlockRequestContext, useFilterByTk } from '../BlockProvider';
import { useDetailsBlockContext } from '../DetailsBlockProvider';
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
  let values = {};
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
  const { visible, setVisible } = useActionContext();
  const history = useHistory();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const { fields, getField } = useCollection();
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
      const assignedValues = parse(originalAssignedValues)({ currentTime: new Date(), currentRecord, currentUser });
      if (!skipValidator) {
        await form.submit();
      }
      const values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
      actionField.data = field.data || {};
      actionField.data.loading = true;
      try {
        await resource.create({
          values: {
            ...values,
            ...overwriteValues,
            ...assignedValues,
          },
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
  const { visible, setVisible } = useActionContext();

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
      let values = getFormValues(filterByTk, field, form, fieldNames, getField, resource);
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
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};

export const useDestroyActionProps = () => {
  const filterByTk = useFilterByTk();
  const { resource, service } = useBlockRequestContext();
  return {
    async onClick() {
      await resource.destroy({
        filterByTk,
      });
      service?.refresh?.();
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
