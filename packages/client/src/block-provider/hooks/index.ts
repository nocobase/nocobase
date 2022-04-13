import { useFieldSchema, useForm } from '@formily/react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useActionContext } from '../../schema-component';
import { useBlockRequestContext, useFilterByTk } from '../BlockProvider';
import { useFormBlockContext } from '../FormBlockProvider';
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
  const { resource, __parent } = useBlockRequestContext();
  const { visible, setVisible } = useActionContext();
  const { field } = useFormBlockContext();
  const history = useHistory();
  const { t } = useTranslation();
  const actionSchema = useFieldSchema();
  return {
    async onClick() {
      await form.submit();
      const initialValues = actionSchema?.['x-action-params']?.initialValues;
      await resource.create({
        values: {
          ...form.values,
          ...initialValues,
        },
      });
      __parent?.service?.refresh?.();
      setVisible?.(false);
      if (visible !== undefined) {
        return;
      }
      const onSuccess = field?.decoratorProps?.onSuccess;
      if (typeof onSuccess === 'function') {
        onSuccess({ form });
      } else {
        Modal.success({
          title: onSuccess?.successMessage || t('Submitted successfully!'),
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

export const useUpdateActionProps = () => {
  const form = useForm();
  const filterByTk = useFilterByTk();
  const { resource, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  const actionSchema = useFieldSchema();
  return {
    async onClick() {
      const initialValues = actionSchema?.['x-action-params']?.initialValues;
      await form.submit();
      await resource.update({
        filterByTk,
        values: {
          ...form.values,
          ...initialValues,
        },
      });
      __parent?.service?.refresh?.();
      if (!(resource instanceof TableFieldResource)) {
        __parent?.__parent?.service?.refresh?.();
      }
      setVisible?.(false);
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
