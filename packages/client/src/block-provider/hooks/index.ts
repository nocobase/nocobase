import { useForm } from '@formily/react';

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
  return {
    onClick() {
      console.log('useCreateActionProps', form.values);
    },
  };
};

export const useUpdateActionProps = () => {
  const form = useForm();
  return {
    onClick() {
      console.log('useUpdateActionProps', form.values);
    },
  };
};

export const useDestroyActionProps = () => {
  return {
    onClick() {
      console.log('useDestroyActionProps');
    },
  };
};

export const useBulkDestroyActionProps = () => {
  return {
    onClick() {
      console.log('useBulkDestroyActionProps');
    },
  };
};
