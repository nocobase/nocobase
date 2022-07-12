import { useForm } from '@formily/react';
import { message } from 'antd';
import { useEffect } from 'react';
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

export const useResetFilterAction = () => {
  const { run } = useResourceActionContext();
  const form = useForm();
  const ctx = useActionContext();

  return {
    async run() {
      form.reset();
      run();
      ctx.setVisible(false);
    },
  };
};

export const useKanbanEvents = () => {
  const { resource } = useCollection();
  return {
    async onCardDragEnd({ columns, groupField }, { fromColumnId, fromPosition }, { toColumnId, toPosition }) {
      const sourceColumn = columns.find((column) => column.id === fromColumnId);
      const destinationColumn = columns.find((column) => column.id === toColumnId);
      const sourceCard = sourceColumn?.cards?.[fromPosition];
      const targetCard = destinationColumn?.cards?.[toPosition];
      const values = {
        sourceId: sourceCard.id,
        sortField: `${groupField.name}_sort`,
      };
      if (targetCard) {
        values['targetId'] = targetCard.id;
      } else {
        values['targetScope'] = {
          [groupField.name]: toColumnId,
        };
      }
      await resource.move(values);
    },
  };
};

export const useSortFields = (collectionName: string) => {
  const { getCollectionFields, getInterface } = useCollectionManager();
  const fields = getCollectionFields(collectionName);
  return fields
    .filter((field: any) => {
      if (!field.interface) {
        return false;
      }
      const fieldInterface = getInterface(field.interface);
      if (fieldInterface.sortable) {
        return true;
      }
      return false;
    })
    .map((field: any) => {
      return {
        value: field.name,
        label: field?.uiSchema?.title || field.name,
      };
    });
};

export const useCollectionFilterOptions = (collectionName: string) => {
  const { getCollectionFields, getInterface } = useCollectionManager();
  const fields = getCollectionFields(collectionName);
  const field2option = (field, depth) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = getInterface(field.interface);
    if (!fieldInterface.filterable) {
      return;
    }
    const { nested, children, operators } = fieldInterface.filterable;
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      operators:
        operators?.filter?.((operator) => {
          return !operator?.visible || operator.visible(field);
        }) || [],
    };
    if (field.target && depth > 2) {
      return;
    }
    if (depth > 2) {
      return option;
    }
    if (children?.length) {
      option['children'] = children;
    }
    if (nested) {
      const targetFields = getCollectionFields(field.target);
      const options = getOptions(targetFields, depth+1).filter(Boolean);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };
  const getOptions = (fields, depth) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  return getOptions(fields, 1);
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
  const { run, params, defaultRequest } = useResourceActionContext();
  const form = useForm();
  const ctx = useActionContext();
  const [first, ...others] = params;
  return {
    async run() {
      const prevFilter = defaultRequest?.params?.filter;
      const filter = prevFilter ? { $and: [prevFilter, form.values.filter] } : form.values.filter;
      run({ ...first, filter }, ...others);
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

export const useUpdateViewAction = () => {
  const form = useForm();
  const ctx = useActionContext();
  // const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      await resource.update({ filterByTk, values: form.values });
      // refresh();
      message.success('保存成功');
    },
  };
};

export const useMoveAction = () => {
  const { resource } = useResourceContext();
  const { refresh } = useResourceActionContext();
  return {
    async move(from, to) {
      await resource.move({
        sourceId: from.id,
        targetId: to.id,
      });
      refresh();
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
  const result = useRequest(() => Promise.resolve({ data: record }), {
    ...options,
    manual: true,
  });
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      result.run();
    }
  }, [ctx.visible]);
  return result;
};

export const useValuesFromRA = (options) => {
  const ctx = useResourceActionContext();
  return useRequest(() => Promise.resolve(ctx.data), {
    ...options,
    refreshDeps: [ctx.data],
  });
};

export const useCreateActionAndRefreshCM = () => {
  const { run } = useCreateAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await refreshCM();
      await run();      
    },
  };
};

export const useUpdateActionAndRefreshCM = () => {
  const { run } = useUpdateAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await refreshCM();
      await run();
    },
  };
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await refreshCM();
      await run();
    },
  };
};

export const useBulkDestroyActionAndRefreshCM = () => {
  const { run } = useBulkDestroyAction();
  const { refreshCM } = useCollectionManager();
  return {
    async run() {
      await refreshCM();
      await run();
    },
  };
};
