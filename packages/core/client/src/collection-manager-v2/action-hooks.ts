import { useField, useForm } from '@formily/react';
import { message } from 'antd';
import _ from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import omit from 'lodash/omit';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';
import { useRecord } from '../record-provider';
import { useActionContext, useSchemaComponentContext } from '../schema-component';
import { useFilterFieldOptions, useFilterFieldProps } from '../schema-component/antd/filter/useFilterActionProps';
import { useResourceActionContext, useResourceContext } from './ResourceActionProvider';
import { useCollectionManagerV2, useCollectionV2 } from '../application';

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

export const useValuesFromRecord = (options) => {
  const record = useRecord();
  const result = useRequest(
    () => Promise.resolve({ data: omit(cloneDeep(record), ['__parent', '__collectionName']) }),
    {
      ...options,
      manual: true,
    },
  );
  const ctx = useActionContext();
  useEffect(() => {
    if (ctx.visible) {
      result.run();
    }
  }, [ctx.visible]);
  return result;
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
  const api = useAPIClient();
  const collection = useCollectionV2();
  const resource = api.resource(collection?.name);
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
  const cm = useCollectionManagerV2();
  const fields = useMemo(() => cm.getCollectionFields(collectionName), [collectionName, cm]);
  return fields
    .filter((field: any) => {
      if (!field.interface) {
        return false;
      }
      const fieldInterface = cm.getCollectionFieldInterface(field.interface);
      if (fieldInterface?.sortable) {
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

export const useChildrenCollections = (collectionName: string) => {
  const cm = useCollectionManagerV2();
  const childrenCollections = getChildrenCollections(collectionName);
  return childrenCollections.map((collection: any) => {
    return {
      value: collection.name,
      label: collection?.title || collection.name,
    };
  });
};

export const useSelfAndChildrenCollections = (collectionName: string) => {
  const cm = useCollectionManagerV2();
  const childrenCollections = getChildrenCollections(collectionName);
  const self = useMemo(() => cm.getCollection(collectionName), [collectionName, cm]);
  if (!collectionName) {
    return null;
  }
  const options = childrenCollections.map((collection: any) => {
    return {
      value: collection.name,
      label: collection?.title || collection.name,
    };
  });
  options.unshift({
    value: self.name,
    label: self?.title || self.name,
  });
  return options;
};

export const useCollectionFilterOptions = (collection: any) => {
  const cm = useCollectionManagerV2();
  return useMemo(() => {
    const fields = cm.getCollectionFields(collection);
    const field2option = (field, depth) => {
      if (!field.interface) {
        return;
      }
      const fieldInterface = cm.getCollectionFieldInterface(field.interface);
      if (!fieldInterface?.filterable) {
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
        interface: field.interface,
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
        const targetFields = cm.getCollectionFields(field.target);
        const options = getOptions(targetFields, depth + 1).filter(Boolean);
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
    const options = getOptions(fields, 1);
    return options;
  }, [_.isString(collection) ? collection : collection?.name]);
};

export const useCollectionFilterOptionsV2 = (collection: any) => {
  const cm = useCollectionManagerV2();

  const getFields = useCallback(() => {
    const fields = cm.getCollectionFields(collection);
    const field2option = (field, depth) => {
      if (!field.interface) {
        return;
      }
      const fieldInterface = cm.getCollectionFieldInterface(field.interface);
      if (!fieldInterface?.filterable) {
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
        interface: field.interface,
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
        const targetFields = cm.getCollectionFields(field.target);
        const options = getOptions(targetFields, depth + 1).filter(Boolean);
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
    const options = getOptions(fields, 1);
    return options;
  }, [_.isString(collection) ? collection : collection?.name]);

  return { getFields };
};

export const useLinkageCollectionFilterOptions = (collectionName: string) => {
  const cm = useCollectionManagerV2();
  const fields = useMemo(() => cm.getCollectionFields(collectionName), [collectionName, cm]);
  const field2option = (field, depth) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = cm.getCollectionFieldInterface(field.interface);
    if (!fieldInterface?.filterable) {
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
      interface: field.interface,
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
      const targetFields = cm.getCollectionFields(field.target).filter((v) => {
        if (['hasMany', 'belongsToMany'].includes(field.type)) {
          return !['hasOne', 'hasMany', 'belongsTo', 'belongsToMany'].includes(v.type);
        }
        return !['hasMany', 'belongsToMany'].includes(v.type);
      });
      const options = getOptions(targetFields, depth + 1).filter(Boolean);
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
  const options = getOptions(fields, 1);
  return options;
};
// 通用
export const useCollectionFieldsOptions = (collectionName: string, maxDepth = 2, excludes = []) => {
  const cm = useCollectionManagerV2();
  const fields = cm.getCollectionFields(collectionName).filter((v) => !excludes.includes(v.interface));

  const field2option = (field, depth, prefix?) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = cm.getCollectionFieldInterface(field.interface);
    if (!fieldInterface?.filterable) {
      return;
    }
    const { nested, children } = fieldInterface.filterable;
    const value = prefix ? `${prefix}.${field.name}` : field.name;
    const option = {
      ...field,
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      key: value,
    };
    if (field.target && depth > maxDepth) {
      return;
    }
    if (depth > maxDepth) {
      return option;
    }
    if (children?.length) {
      option['children'] = children.map((v) => {
        return {
          ...v,
          key: `${field.name}.${v.name}`,
        };
      });
    }
    if (nested) {
      const targetFields = cm.getCollectionFields(field.target).filter((v) => !excludes.includes(v.interface));
      const options = getOptions(targetFields, depth + 1, field.name).filter(Boolean);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };
  const getOptions = (fields, depth, prefix?) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth, prefix);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  const options = getOptions(fields, 1);
  return options;
};

export const useFilterDataSource = (options) => {
  const { name } = useCollectionV2();
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
  const field = useField();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      try {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        await resource.create({ values: form.values });
        ctx.setVisible(false);
        await form.reset();
        field.data.loading = false;
        refresh();
      } catch (error) {
        if (field.data) {
          field.data.loading = false;
        }
      }
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
  const field = useField();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        await resource.update({ filterByTk, values: form.values });
        ctx.setVisible(false);
        await form.reset();
        refresh();
      } catch (e) {
        console.log(e);
      } finally {
        field.data.loading = false;
      }
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
  const { resource } = useResourceContext();
  const { t } = useTranslation();
  return {
    async run() {
      if (!state?.selectedRowKeys?.length) {
        return message.error(t('Please select the records you want to delete'));
      }
      await resource.destroy({
        filterByTk: state?.selectedRowKeys || [],
      });
      setState?.({ selectedRowKeys: [] });
      refresh();
    },
  };
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
  const cm = useCollectionManagerV2();
  const { refresh } = useSchemaComponentContext();
  return {
    async run() {
      await run();
      await cm.reload(refresh);
    },
  };
};

export const useUpdateActionAndRefreshCM = () => {
  const { run } = useUpdateAction();
  const cm = useCollectionManagerV2();
  const { refresh } = useSchemaComponentContext();
  return {
    async run() {
      await run();
      await cm.reload(refresh);
    },
  };
};

export const useDestroyActionAndRefreshCM = () => {
  const { run } = useDestroyAction();
  const cm = useCollectionManagerV2();
  const { refresh } = useSchemaComponentContext();
  return {
    async run() {
      await run();
      await cm.reload(refresh);
    },
  };
};

export const useDeleteButtonDisabled = (record?: any) => {
  const recordFromProvider = useRecord();
  return isDeleteButtonDisabled(record || recordFromProvider);
};

export const isDeleteButtonDisabled = (record?: any) => {
  const { interface: i, deletable = true } = record || {};

  return !deletable || i === 'id';
};

export const useBulkDestroyActionAndRefreshCM = () => {
  const { run } = useBulkDestroyAction();
  const cm = useCollectionManagerV2();
  const { refresh } = useSchemaComponentContext();
  return {
    async run() {
      await run();
      await cm.reload(refresh);
    },
  };
};

export const useFilterActionProps = () => {
  const { collection } = useResourceContext();
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    // 目前仅需要支持筛选 title 和 name，其它字段可能会报错。详见：https://nocobase.height.app/T-2745
    options: options.filter((option) => ['title', 'name'].includes(option.name)),
    params: service.state?.params?.[0] || service.params,
    service,
  });
};
