import { useFieldSchema, useForm } from '@formily/react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useCollection } from '../../collection-manager';
import { useActionContext } from '../../schema-component';
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

function isURL(string) {
  let url;

  try {
    url = new URL(string);
  } catch (e) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

export const useCreateActionProps = () => {
  const form = useForm();
  const { field, resource, __parent } = useBlockRequestContext();
  const { visible, setVisible } = useActionContext();
  const history = useHistory();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  const { fields, getField } = useCollection();
  return {
    async onClick() {
      const fieldNames = fields.map((field) => field.name);
      const skipValidator = actionSchema?.['x-action-settings']?.skipValidator;
      const overwriteValues = actionSchema?.['x-action-settings']?.overwriteValues;
      if (!skipValidator) {
        await form.submit();
      }
      let values = {};
      if (resource instanceof TableFieldResource) {
        values = form.values;
      } else {
        for (const key in form.values) {
          if (fieldNames.includes(key)) {
            const items = form.values[key];
            const collectionField = getField(key);
            if (collectionField.interface === 'linkTo') {
              const targetKey = collectionField.targetKey || 'id';
              if (Array.isArray(items)) {
                values[key] = items.map((item) => item[targetKey]);
              } else if (items && typeof items === 'object') {
                values[key] = items[targetKey];
              } else {
                values[key] = items;
              }
            } else {
              values[key] = form.values[key];
            }
          } else {
            values[key] = form.values[key];
          }
        }
      }
      await resource.create({
        values: {
          ...values,
          ...overwriteValues,
        },
      });
      __parent?.service?.refresh?.();
      setVisible?.(false);
      const onSuccess = actionSchema?.['x-action-settings']?.onSuccess;
      if (!onSuccess?.successMessage) {
        return;
      }
      Modal.success({
        title: onSuccess?.successMessage,
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
  return {
    async onClick() {
      const skipValidator = actionSchema?.['x-action-settings']?.skipValidator;
      const overwriteValues = actionSchema?.['x-action-settings']?.overwriteValues;
      if (!skipValidator) {
        await form.submit();
      }
      const fieldNames = fields.map((field) => field.name);
      let values = {};
      if (resource instanceof TableFieldResource) {
        values = form.values;
      } else {
        for (const key in form.values) {
          if (fieldNames.includes(key)) {
            const collectionField = getField(key);
            if (collectionField.interface === 'subTable') {
              values[key] = form.values[key];
              continue;
            }
            if (!field.added.has(key)) {
              continue;
            }
            const items = form.values[key];
            if (collectionField.interface === 'linkTo') {
              const targetKey = collectionField.targetKey || 'id';
              if (Array.isArray(items)) {
                values[key] = items.map((item) => item[targetKey]);
              } else if (items && typeof items === 'object') {
                values[key] = items[targetKey];
              } else {
                values[key] = items;
              }
            } else {
              values[key] = form.values[key];
            }
          } else {
            values[key] = form.values[key];
          }
        }
      }
      await resource.update({
        filterByTk,
        values: {
          ...values,
          ...overwriteValues,
        },
      });
      __parent?.service?.refresh?.();
      if (!(resource instanceof TableFieldResource)) {
        __parent?.__parent?.service?.refresh?.();
      }
      setVisible?.(false);
      const onSuccess = actionSchema?.['x-action-settings']?.onSuccess;
      if (onSuccess?.successMessage) {
        Modal.success({
          title: onSuccess?.successMessage,
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
