/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { useField, useFieldSchema } from '@formily/react';
import flat from 'flat';
import _ from 'lodash';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../';
import { useCollectionManager } from '../../../data-source/collection/CollectionManagerProvider';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { useDataBlockProps } from '../../../data-source/data-block/DataBlockProvider';
import { useDataBlockRequestGetter } from '../../../data-source/data-block/DataBlockRequestProvider';
import { useDataSourceManager } from '../../../data-source/data-source/DataSourceManagerProvider';
import { mergeFilter } from '../../../filter-provider/utils';
import { useDataLoadingMode } from '../../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';
export const useGetFilterOptions = () => {
  const dm = useDataSourceManager();
  const getFilterFieldOptions = useGetFilterFieldOptions();

  return (collectionName, dataSource?: string, usedInVariable?: boolean) => {
    const cm = dm?.getDataSource(dataSource)?.collectionManager;
    const fields = cm?.getCollectionFields(collectionName);
    const options = getFilterFieldOptions(fields, usedInVariable);
    return options;
  };
};

export const useFilterOptions = (collectionName: string) => {
  const cm = useCollectionManager();
  const fields = cm?.getCollectionFields(collectionName);
  const options = useFilterFieldOptions(fields);
  return options;
};

export const useGetFilterFieldOptions = () => {
  const fieldSchema = useFieldSchema();
  const nonfilterable = fieldSchema?.['x-component-props']?.nonfilterable || [];
  const cm = useCollectionManager();
  const dm = useDataSourceManager();

  const field2option = (field, depth, usedInVariable?: boolean) => {
    if (nonfilterable.length && depth === 1 && nonfilterable.includes(field.name)) {
      return;
    }
    if (!field.interface) {
      return;
    }

    const fieldInterface = dm?.collectionFieldInterfaceManager.getFieldInterface(field.interface);
    if (!fieldInterface?.filterable && !usedInVariable) {
      return;
    }

    const { nested, children, operators } = fieldInterface?.filterable || {};
    const option = {
      name: field.name,
      type: field.type,
      target: field.target,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      interface: field.interface,
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
      const targetFields = cm?.getCollectionFields(field.target);
      const options = getOptions(targetFields, depth + 1).filter(Boolean);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };

  const getOptions = (fields, depth, usedInVariable?: boolean) => {
    const options = [];
    fields?.forEach((field) => {
      const option = field2option(field, depth, usedInVariable);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };

  return (fields, usedInVariable) => getOptions(fields, 1, usedInVariable);
};

const field2option = (field, depth, nonfilterable, dataSourceManager, collectionManager) => {
  if (nonfilterable.length && depth === 1 && nonfilterable.includes(field.name)) {
    return;
  }
  if (!field.interface) {
    return;
  }
  if (field.filterable === false) {
    return;
  }
  const fieldInterface = dataSourceManager?.collectionFieldInterfaceManager.getFieldInterface(field.interface);
  if (!fieldInterface?.filterable) {
    return;
  }
  const { nested, children, operators } = fieldInterface.filterable;
  const option = {
    name: field.name,
    type: field.type,
    target: field.target,
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
    const targetFields = dataSourceManager
      .getDataSource(field.dataSourceKey)
      .collectionManager.getCollectionFields(field.target);
    const options = getOptions(targetFields, depth + 1, nonfilterable, dataSourceManager, collectionManager).filter(
      Boolean,
    );
    option['children'] = option['children'] || [];
    option['children'].push(...options);
  }
  return option;
};

const getOptions = (fields, depth, nonfilterable, dataSourceManager, collectionManager) => {
  const options = [];
  fields.forEach((field) => {
    const option = field2option(field, depth, nonfilterable, dataSourceManager, collectionManager);
    if (option) {
      options.push(option);
    }
  });
  return options;
};

export const useFilterFieldOptions = (fields) => {
  const fieldSchema = useFieldSchema();
  const nonfilterable = fieldSchema?.['x-component-props']?.nonfilterable || [];
  const cm = useCollectionManager();
  const dm = useDataSourceManager();

  return getOptions(fields, 1, nonfilterable, dm, cm);
};

const isEmpty = (obj) => {
  return (
    (Array.isArray(obj) && obj.length === 0) ||
    (obj && Object.keys(obj).length === 0 && Object.getPrototypeOf(obj) === Object.prototype)
  );
};

export const removeNullCondition = (filter, customFlat = flat) => {
  const items = customFlat(filter || {});
  const values = {};
  for (const key in items) {
    const value = items[key];
    if (value != null && !isEmpty(value)) {
      values[key] = value;
    }
  }
  return customFlat.unflatten(values);
};

export const useFilterActionProps = () => {
  const collection = useCollection();
  const options = useFilterOptions(collection?.name);
  const props = useDataBlockProps();
  return useFilterFieldProps({ options, params: props?.params });
};

export const useFilterFieldProps = ({ options, service, params }: { options: any[]; service?: any; params?: any }) => {
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { t } = useTranslation();
  const field = useField<Field>();
  const dataLoadingMode = useDataLoadingMode();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const onSubmit = useCallback(
    (values) => {
      const _service = service || getDataBlockRequest();
      const _params = params || _service.state?.params?.[0] || _service.params;

      // filter parameter for the block
      const defaultFilter = _params.filter;
      // filter parameter for the filter action
      const filter = removeNullCondition(values?.filter);

      if (dataLoadingMode === 'manual' && _.isEmpty(filter)) {
        return _service?.mutate(undefined);
      }

      const filters = _service?.params?.[1]?.filters || {};
      filters[`filterAction`] = filter;
      _service?.run(
        { ..._service?.params?.[0], page: 1, filter: mergeFilter([...Object.values(filters), defaultFilter]) },
        { filters },
      );
      const items = filter?.$and || filter?.$or;
      if (items?.length) {
        field.title = t('{{count}} filter items', { count: items?.length || 0 });
      } else {
        field.title = compile(fieldSchema.title) || t('Filter');
      }
    },
    [dataLoadingMode, field, getDataBlockRequest, params, service, t, fieldSchema.title],
  );

  const onReset = useCallback(() => {
    const _service = service || getDataBlockRequest();
    const _params = params || _service.state?.params?.[0] || _service.params;

    const filter = _params.filter;
    const filters = _service?.params?.[1]?.filters || {};
    delete filters[`filterAction`];

    const newParams = [
      {
        ..._service?.params?.[0],
        filter: mergeFilter([...Object.values(filters), filter]),
        page: 1,
      },
      { filters },
    ];

    field.title = compile(fieldSchema.title) || t('Filter');

    if (dataLoadingMode === 'manual') {
      _service.params = newParams;
      return _service?.mutate(undefined);
    }

    _service?.run(...newParams);
  }, [dataLoadingMode, field, getDataBlockRequest, params, service, t, fieldSchema.title]);

  return {
    options,
    onSubmit,
    onReset,
  };
};
