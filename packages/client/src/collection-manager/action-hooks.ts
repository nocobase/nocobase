import { useForm } from '@formily/react';
import { useCollection, useCollectionManager } from '.';
import { useRequest } from '../api-client';
import { useRecord } from '../record-provider';
import { useActionContext } from '../schema-component';
import { useResourceActionContext, useResourceContext } from './ResourceActionProvider';

export const useCancelAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      ctx.setVisible(false);
      form.reset();
    },
  };
};

export const useCancelFilterAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  return {
    async run() {
      ctx.setVisible(false);
    },
  };
};

export const useCollectionFilterOptions = (collectionName: string) => {
  const { getCollection, getInterface } = useCollectionManager();
  const options = [];
  const collection = getCollection(collectionName);
  const fields = collection?.fields || [];
  const field2option = (field) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = getInterface(field.interface);
    if (!fieldInterface.operators) {
      return;
    }
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      operators: fieldInterface.operators || [],
    };
    return option;
  };
  fields.forEach((field) => {
    const option = field2option(field);
    if (option) {
      options.push(option);
    }
  });
  return options;
};

export const useFilterDataSource = (options) => {
  const { name } = useCollection();
  const data = useCollectionFilterOptions(name);
  return useRequest(
    () =>
      Promise.resolve({
        data,
      }),
    options,
  );
};

export const useFilterAction = () => {
  const { run, params } = useResourceActionContext();
  const form = useForm();
  const ctx = useActionContext();
  const [first, ...others] = params;
  return {
    async run() {
      run({ ...first, filter: form.values.filter }, ...others);
      ctx.setVisible(false);
    },
  };
};

export const useCreateAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      await resource.create({ values: form.values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

export const useCreateActionWithoutRefresh = () => {
  const form = useForm();
  const { resource } = useResourceContext();
  return {
    async run() {
      await form.submit();
      await resource.create({ values: form.values });
      await form.reset();
    },
  };
};

export const useUpdateAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({ filterByTk, values: form.values });
      ctx.setVisible(false);
      await form.reset();
      refresh();
    },
  };
};

export const useDestroyAction = () => {
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await resource.destroy({ filterByTk });
      refresh();
    },
  };
};

export const useBulkDestroyAction = () => {
  const { state, setState, refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  return {
    async run() {
      await resource.destroy({
        filterByTk: state?.selectedRowKeys || [],
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
};

export const useValuesFromRecord = (options) => {
  const record = useRecord();
  return useRequest(() => Promise.resolve({ data: record }), {
    ...options,
    refreshDeps: [record],
  });
};

export const useCreateActionAndRefreshCM = () => {
  const { run } = useCreateAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

export const useUpdateActionAndRefreshCM = () => {
  const { run } = useUpdateAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};

export const useBulkDestroyActionAndRefreshCM = () => {
  const { run } = useBulkDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await run();
      await refreshCM();
    },
  };
};
