/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField } from '@formily/core';
import { ISchema, Schema, useForm } from '@formily/react';
import {
  CollectionFieldOptions,
  DEFAULT_DATA_SOURCE_KEY,
  useACLRoleContext,
  useDataSourceManager,
  usePlugin,
} from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartConfigContext } from '../configure';
import formatters from '../configure/formatters';
import { useChartsTranslation } from '../locale';
import { ChartRendererContext } from '../renderer';
import { getField, getSelectedFields, parseField } from '../utils';
import PluginDataVisualiztionClient from '..';

export type FieldOption = {
  value: string;
  label: string;
  key: string;
  alias?: string;
  name?: string;
  type?: string;
  interface?: string;
  uiSchema?: ISchema;
  target?: string;
  targetFields?: FieldOption[];
};

export const useChartDataSource = (dataSource?: string) => {
  const { current } = useContext(ChartConfigContext);
  const { dataSource: currentDataSource, collection } = current || {};
  dataSource = dataSource || currentDataSource || DEFAULT_DATA_SOURCE_KEY;
  const dm = useDataSourceManager();
  const ds = dm.getDataSource(dataSource);
  const fim = dm.collectionFieldInterfaceManager;
  const cm = ds?.collectionManager;
  return { cm, fim, collection };
};

export const useFields = (
  collectionFields: CollectionFieldOptions[],
): (CollectionFieldOptions & {
  key: string;
  label: string;
  value: string;
})[] => {
  const fields = (collectionFields || [])
    .filter((field) => {
      return field.interface;
    })
    .map((field) => ({
      ...field,
      key: field.name,
      label: field.uiSchema?.title || field.name,
      value: field.name,
    }));
  return fields;
};

export const useFieldsWithAssociation = (dataSource?: string, collection?: string) => {
  const { t } = useTranslation();
  const { cm, fim, collection: _collection } = useChartDataSource(dataSource);
  const collectionFields = cm.getCollectionFields(collection || _collection);
  const fields = useFields(collectionFields);
  return useMemo(
    () =>
      fields.map((field) => {
        const filterable = fim.getFieldInterface(field.interface)?.filterable;
        const label = Schema.compile(field.uiSchema?.title || field.name, { t });
        if (!(filterable && (filterable?.nested || filterable?.children?.length))) {
          return { ...field, label };
        }
        let targetFields = [];
        if (filterable?.nested) {
          const nestedFields = (cm.getCollectionFields(field.target) || [])
            .filter((targetField) => {
              return targetField.interface;
            })
            .map((targetField) => ({
              ...targetField,
              key: `${field.name}.${targetField.name}`,
              label: `${label} / ${Schema.compile(targetField.uiSchema?.title || targetField.name, { t })}`,
              value: `${field.name}.${targetField.name}`,
            }));
          targetFields = [...targetFields, ...nestedFields];
        }

        if (filterable?.children?.length) {
          const children = filterable.children.map((child: any) => ({
            ...child,
            key: `${field.name}.${child.name}`,
            label: `${label} / ${Schema.compile(child.schema?.title || child.title || child.name, { t })}`,
            value: `${field.name}.${child.name}`,
          }));
          targetFields = [...targetFields, ...children];
        }

        return {
          ...field,
          label,
          targetFields,
        };
      }),
    [fields],
  );
};

export const useChartFields = (fields: FieldOption[]) => (field: any) => {
  const query = field.query('query').get('value') || {};
  const selectedFields = getSelectedFields(fields, query);
  field.dataSource = selectedFields;
};

export const useFormatters = (fields: FieldOption[]) => (field: any) => {
  const selectedField = field.query('.field').get('value');
  if (!selectedField) {
    field.dataSource = [];
    return;
  }
  let options = [];
  const fieldInterface = getField(fields, selectedField)?.interface;
  switch (fieldInterface) {
    case 'datetime':
    case 'datetimeTz':
    case 'unixTimestamp':
    case 'datetimeNoTz':
    case 'createdAt':
    case 'updatedAt':
      options = formatters.datetime;
      break;
    case 'date':
      options = formatters.date;
      break;
    case 'time':
      options = formatters.time;
      break;
    default:
      options = [];
  }
  field.dataSource = options;
};

export const useCollectionOptions = () => {
  const { t } = useTranslation();
  const dm = useDataSourceManager();
  const { parseAction } = useACLRoleContext();
  const allCollections = dm.getAllCollections({
    filterCollection: (collection) => {
      const params = parseAction(`${collection.name}:list`);
      return params;
    },
  });
  const options = allCollections
    .filter(({ key, isDBInstance }) => key === DEFAULT_DATA_SOURCE_KEY || isDBInstance)
    .map(({ key, displayName, collections }) => ({
      value: key,
      label: displayName,
      children: collections.map((collection) => ({
        value: collection.name,
        label: collection.title,
      })),
    }));
  return useMemo(() => Schema.compile(options, { t }), [options]);
};

export const useOrderFieldsOptions = (defaultOptions: any[], fields: FieldOption[]) => (field: any) => {
  const query = field.query('query').get('value') || {};
  const { measures = [] } = query;
  const hasAgg = measures.some((measure: { aggregation?: string }) => measure.aggregation);
  if (!hasAgg) {
    field.componentProps.fieldNames = {
      label: 'title',
      value: 'name',
      children: 'children',
    };
    field.dataSource = defaultOptions;
    return;
  }
  const selectedFields = getSelectedFields(fields, query);
  field.componentProps.fieldNames = {};
  field.dataSource = selectedFields;
};

export const useOrderReaction = (defaultOptions: any[], fields: FieldOption[]) => (field: ArrayField) => {
  const query = field.query('query').get('value') || {};
  const { measures = [] } = query;
  const hasAgg = measures.some((measure: { aggregation?: string }) => measure.aggregation);
  let dataSource = defaultOptions;
  const allValues = [];
  if (hasAgg) {
    dataSource = getSelectedFields(fields, query);
    dataSource.forEach((field) => {
      allValues.push(field.value);
    });
  } else {
    dataSource.forEach((field) => {
      const children = field.children || [];
      if (!children.length) {
        allValues.push(field.value || field.name);
      }
      children.forEach((child: any) => {
        allValues.push(`${field.name}.${child.name}`);
      });
    });
  }

  const orders = field.value || [];
  const newOrders = orders.reduce((newOrders: any[], item: any) => {
    const { alias } = parseField(item.field);
    if (!item.field || allValues.includes(alias)) {
      newOrders.push(item);
    }
    return newOrders;
  }, []);
  field.setValue(newOrders);
};

export const useData = (data?: any[], dataSource?: string, collection?: string) => {
  const { service, query } = useContext(ChartRendererContext);
  const plugin = usePlugin(PluginDataVisualiztionClient);
  const fields = useFieldsWithAssociation(dataSource, collection);
  const form = useForm();
  const selectedFields = getSelectedFields(fields, form?.values?.query || query) as (FieldOption & { query?: any })[];
  const fieldInterfaceConfigs = plugin.fieldInterfaceConfigs;
  const formatters = {};
  for (const field of selectedFields) {
    if (field?.query?.aggregation) {
      continue;
    }
    const config = fieldInterfaceConfigs[field.interface];
    if (!config) {
      continue;
    }
    const { valueFormatter } = config;
    formatters[field.value] = (value: any) => valueFormatter(field, value);
  }
  return (service?.data || data || []).map((record: any) => {
    const processed = {};
    Object.entries(record).forEach(([key, value]) => {
      const formatter = formatters[key];
      if (!formatter) {
        processed[key] = value;
        return;
      }
      processed[key] = formatter(value);
    });
    return processed;
  });
};

export const useCollectionFieldsOptions = (dataSource: string, collectionName: string, maxDepth = 2, excludes = []) => {
  const { cm, fim, collection } = useChartDataSource(dataSource);
  const collectionFields = cm.getCollectionFields(collectionName || collection);
  const fields = collectionFields.filter((v) => !excludes.includes(v.interface));

  const field2option = (field, depth, prefix?) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = fim.getFieldInterface(field.interface);
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

export const useCollectionFilterOptions = (dataSource: string, collection: string) => {
  const { cm, fim, collection: _collection } = useChartDataSource(dataSource);
  return useMemo(() => {
    const fields = cm.getCollectionFields(collection || _collection);
    const field2option = (field, depth) => {
      if (!field.interface) {
        return;
      }
      const fieldInterface = fim.getFieldInterface(field.interface);
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
  }, [collection, cm, fim]);
};
