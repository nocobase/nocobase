import { useForm } from '@formily/react';
import { useActionContext } from '../../schema-component';
import { useBlockRequestContext, useFilterByTk } from '../BlockProvider';

export const usePickActionProps = () => {
  const form = useForm();
  return {
    onClick() {
      console.log('usePickActionProps', form.values);
    },
  };
};

export const useCreateActionProps = () => {
  const form = useForm();
  const { resource, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  return {
    async onClick() {
      await form.submit();
      await resource.create({
        values: form.values,
      });
      __parent?.service?.refresh?.();
      setVisible?.(false);
    },
  };
};

export const useUpdateActionProps = () => {
  const form = useForm();
  const filterByTk = useFilterByTk();
  const { resource, __parent } = useBlockRequestContext();
  const { setVisible } = useActionContext();
  return {
    async onClick() {
      await form.submit();

      await resource.update({
        filterByTk,
        values: form.values,
      });
      __parent?.service?.refresh?.();
      __parent?.__parent?.service?.refresh?.();
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
      service?.refresh?.();
    },
  };
};
