/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import {
  Collection,
  CollectionFieldInterfaceManager,
  CollectionManager,
  SchemaInitializerItemType,
  i18n,
  useActionContext,
  useCollectionManager_deprecated,
  useDataSourceManager,
  useVariables,
  useLocalVariables,
} from '@nocobase/client';
import { flatten, parse, unflatten } from '@nocobase/utils/client';
import { useMemoizedFn } from 'ahooks';
import deepmerge from 'deepmerge';
import { default as _, default as lodash } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { ChartFilterContext } from '../filter/FilterProvider';
import { findSchema, getFilterFieldPrefix, parseFilterFieldName } from '../filter/utils';
import { useChartsTranslation } from '../locale';
import { getFormulaComponent, getValuesByPath } from '../utils';

export const useCustomFieldInterface = () => {
  const { getInterface } = useCollectionManager_deprecated();
  return {
    getSchemaByInterface: (fieldInterface: string) => {
      const interfaceConfig = getInterface(fieldInterface);
      const defaultSchema = interfaceConfig?.default.uiSchema;
      const schema = {
        ...defaultSchema,
      };
      switch (fieldInterface) {
        case 'datetime':
          return {
            ...schema,
            'x-component-props': {
              ...defaultSchema['x-component-props'],
              showTime: true,
            },
          };
        default:
          return {
            ...schema,
            'x-component-props': {
              ...defaultSchema['x-component-props'],
            },
          };
      }
    },
  };
};

export const useChartData = () => {
  const { charts } = useContext(ChartDataContext);

  const chartCollections: {
    [dataSource: string]: string[];
  } = useMemo(() => {
    return Object.values(charts)
      .filter((chart) => chart)
      .reduce((mp, chart) => {
        const { dataSource, collection } = chart;
        if (mp[dataSource]?.includes(collection)) {
          return mp;
        }
        mp[dataSource] = [...(mp[dataSource] || []), collection];
        return mp;
      }, {});
  }, [charts]);

  const showDataSource = useMemo(() => {
    return Object.keys(chartCollections).length > 1;
  }, [chartCollections]);

  const getIsChartCollectionExists = useCallback(
    (dataSource: string, collection: string) => {
      return chartCollections[dataSource]?.includes(collection) || false;
    },
    [chartCollections],
  );

  return {
    chartCollections,
    showDataSource,
    getIsChartCollectionExists,
  };
};

export const useChartFilter = () => {
  const dm = useDataSourceManager();
  const { charts } = useContext(ChartDataContext);
  const { fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];
  const { fields: fieldProps, form } = useContext(ChartFilterContext);
  const variables = useVariables();
  const localVariables = useLocalVariables();

  const getChartFilterFields = ({
    dataSource,
    collection,
    cm,
    fim,
  }: {
    dataSource: string;
    collection: Collection;
    cm: CollectionManager;
    fim: CollectionFieldInterfaceManager;
  }) => {
    const fields = cm.getCollectionFields(collection.name);
    const field2item = (field: any, title: string, name: string, fieldName: string) => {
      const fieldTitle = field.uiSchema?.title || field.name;
      const interfaceConfig = fim.getFieldInterface(field.interface);
      const defaultOperator = interfaceConfig?.filterable?.operators?.[0];
      const targetCollection = cm.getCollection(field.target);
      title = title ? `${title} / ${fieldTitle}` : fieldTitle;
      let schema = {
        type: 'string',
        title,
        name: `${name}.${field.name}`,
        required: false,
        'x-toolbar': 'ChartFilterItemToolbar',
        'x-settings': 'chart:filterForm:item',
        'x-component': 'CollectionField',
        'x-decorator': 'ChartFilterFormItem',
        'x-data-source': dataSource,
        'x-collection-field': `${fieldName}.${field.name}`,
        'x-component-props': {
          utc: false,
          underFilter: true,
          component: defaultOperator?.schema?.['x-component'],
          'filter-operator': defaultOperator,
          'data-source': dataSource,
          'collection-field': `${fieldName}.${field.name}`,
        },
      };
      if (field.interface === 'formula') {
        const component = getFormulaComponent(field.dataType) || 'Input';
        schema = {
          ...schema,
          'x-component': component,
        };
      }
      if (['oho', 'o2m'].includes(field.interface)) {
        _.set(schema, 'x-component-props.useOriginalFilter', true);
      }
      const resultItem: SchemaInitializerItemType = {
        key: `${name}.${field.name}`,
        name: field.name,
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        Component: 'CollectionFieldInitializer',
        find: findSchema,
        remove: (schema, cb) => {
          cb(schema, {
            breakRemoveOn: {
              'x-component': 'Grid',
            },
          });
        },
        schemaInitialize: (s: any) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            block: 'FilterForm',
            readPretty: form.readPretty,
            action,
            targetCollection,
          });
        },
        schema,
      };

      return resultItem;
    };

    const children2item = (child: any, title: string, name: string, fieldName: string) => {
      const childTitle = child.uiSchema?.title || child.name;
      title = title ? `${title} / ${childTitle}` : childTitle;
      const defaultOperator = child.operators[0];
      let schema = {
        type: 'string',
        name: `${name}.${child.name}`,
        required: false,
        'x-settings': 'chart:filterForm:item',
        'x-toolbar': 'ChartFilterItemToolbar',
        'x-decorator': 'ChartFilterFormItem',
        'x-component': 'CollectionField',
        'x-data-source': dataSource,
        'x-collection-field': `${fieldName}.${child.name}`,
        ...child.schema,
        title,
        'x-component-props': {
          utc: false,
          underFilter: true,
          component: defaultOperator?.schema?.['x-component'],
          'filter-operator': defaultOperator,
          'data-source': dataSource,
          'collection-field': `${fieldName}.${child.name}`,
        },
      };
      if (defaultOperator?.noValue) {
        schema = {
          ...schema,
          'x-component': 'ChartFilterCheckbox',
          'x-component-props': {
            ...schema['x-component-props'],
            content: Schema.compile(defaultOperator.label, { t: i18n.t }),
          },
        };
      }
      const resultItem: SchemaInitializerItemType = {
        key: `${name}.${child.name}`,
        name: child.name,
        type: 'item',
        title: child.title || child.name,
        Component: 'CollectionFieldInitializer',
        find: findSchema,
        remove: (schema, cb) => {
          cb(schema, {
            breakRemoveOn: {
              'x-component': 'Grid',
            },
          });
        },
        schema,
      };

      return resultItem;
    };

    const field2option = (
      field: any,
      depth: number,
      title: string,
      name: string,
      fieldName: string,
    ): SchemaInitializerItemType => {
      if (!field.interface || field.isForeignKey) {
        return;
      }
      const fieldInterface = fim.getFieldInterface(field.interface);
      if (!fieldInterface?.filterable) {
        return;
      }
      const { nested, children } = fieldInterface.filterable;
      const fieldTitle = field.uiSchema?.title || field.name;
      const item = field2item(field, title, name, fieldName);
      if (field.target && depth > 2) {
        return;
      }
      title = title ? `${title} / ${fieldTitle}` : fieldTitle;
      if (children?.length && !['chinaRegion', 'createdBy', 'updatedBy', 'attachment'].includes(field.interface)) {
        const items = children.map((child: any) =>
          children2item(child, title, `${name}.${field.name}`, `${fieldName}.${field.name}`),
        );
        return {
          key: `${name}.${field.name}`,
          name: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: items,
        };
      }
      if (!depth || depth > 2) {
        return item;
      }
      if (nested) {
        const targetFields = cm.getCollectionFields(field.target);
        const items = targetFields.map((targetField) =>
          field2option(targetField, depth + 1, '', `${name}.${field.name}`, `${fieldName}.${field.name}`),
        );
        return {
          key: `${name}.${field.name}`,
          name: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: items.filter(Boolean),
        };
      }
      return item;
    };

    const options: SchemaInitializerItemType[] = [];
    const associationOptions = [];
    fields.forEach((field) => {
      const fieldInterface = field.interface;
      const option = field2option(field, 0, '', getFilterFieldPrefix(dataSource, collection.name), collection.name);
      if (option) {
        options.push(option);
      }
      if (['m2o'].includes(fieldInterface)) {
        const option = field2option(field, 1, '', getFilterFieldPrefix(dataSource, collection.name), collection.name);
        if (option) {
          associationOptions.push(option);
        }
      }
    });
    if (associationOptions.length) {
      options.push(
        {
          name: 'divider',
          type: 'divider',
        },
        {
          name: 'displayAssociationFields',
          type: 'itemGroup',
          title: i18n.t('Display association fields'),
          children: associationOptions,
        },
      );
    }
    return options;
  };

  const getFilter = () => {
    const values = form?.values || {};
    const filter = {};
    Object.entries(fieldProps)
      .filter(([_, props]) => props)
      .forEach(([name, props]) => {
        const { operator } = props || {};
        let { dataSource, collectionField: fieldName } = props || {};
        if (!fieldName) {
          const parsed = parseFilterFieldName(name);
          dataSource = parsed.dataSource;
          fieldName = parsed.fieldName;
        }
        const ds = dm.getDataSource(dataSource);
        const cm = ds.collectionManager;
        const field = cm.getCollectionField(fieldName);
        if (field?.target) {
          const tk = field.targetKey || 'id';
          fieldName = `${fieldName}.${tk}`;
          name = `${name}.${tk}`;
        }
        const [collection, ...fields] = fieldName.split('.');
        const value = getValuesByPath(values, name);
        const op = operator?.value || '$eq';
        if (collection !== 'custom') {
          const key = getFilterFieldPrefix(dataSource, collection);
          filter[key] = filter[key] || { $and: [] };
          const condition = {};
          lodash.set(condition, fields.join('.'), { [op]: value });
          filter[key].$and.push(condition);
        } else {
          filter[collection] = filter[collection] || {};
          filter[collection][`$nFilter.${fields.join('.')}`] = value;
        }
      });
    return filter;
  };

  const hasFilter = (chart: { dataSource: string; collection: string; query: any }, filterValues: any) => {
    if (!chart) {
      return false;
    }
    const { dataSource, collection, query } = chart;
    const { parameters } = parse(query.filter || '');
    return (
      filterValues[getFilterFieldPrefix(dataSource, collection)] ||
      (filterValues['custom'] &&
        parameters?.find(({ key }: { key: string }) => lodash.has(filterValues['custom'], key)))
    );
  };

  const appendFilter = (chart: { dataSource: string; collection: string; query: any }, filterValues: any) => {
    const { dataSource, collection, query } = chart;
    let newQuery = { ...query };
    const originFilter = { ...(newQuery.filter || {}) };
    let filter = {};
    const parsed = parse(originFilter);
    const { parameters } = parsed;
    if (filterValues['custom'] && parameters?.find((param: { key: string }) => filterValues['custom'][param.key])) {
      filter = parsed(filterValues['custom']);
    }
    filter = deepmerge(originFilter, filter);
    newQuery = {
      ...newQuery,
      filter: {
        $and: [filter, filterValues[getFilterFieldPrefix(dataSource, collection)]],
      },
    };
    return newQuery;
  };

  const filter = async () => {
    const filterValues = getFilter();
    const requests = Object.values(charts)
      .filter((chart) => hasFilter(chart, filterValues))
      .map((chart) => async () => {
        const { dataSource, service, collection } = chart;
        await service.runAsync(dataSource, collection, appendFilter(chart, filterValues), true);
      });
    await Promise.all(requests.map((request) => request()));
  };

  const refresh = async () => {
    const requests = Object.values(charts)
      .filter((chart) => {
        return chart;
      })
      .map((chart) => async () => {
        const { service, dataSource, collection, query } = chart;
        await service.runAsync(dataSource, collection, query, true);
      });
    await Promise.all(requests.map((request) => request()));
  };

  const getTranslatedTitle = useMemoizedFn((title: string) => {
    return title
      .split(' / ')
      .map((item: string) => i18n.t(Schema.compile(item, { t: i18n.t })))
      .join(' / ');
  });

  const parseFilter = useCallback(
    async (filterValue: any) => {
      const flat = flatten(filterValue, {
        breakOn({ key }) {
          return key.startsWith('$') && key !== '$and' && key !== '$or';
        },
        transformValue(value) {
          if (!(typeof value === 'string' && value.startsWith('{{$') && value?.endsWith('}}'))) {
            return value;
          }
          if (['$user', '$date', '$nDate', '$nRole', '$nFilter'].some((n) => value.includes(n))) {
            return value;
          }
          const result = variables?.parseVariable(value, localVariables).then(({ value }) => value);
          return result;
        },
      });
      await Promise.all(
        Object.keys(flat).map(async (key) => {
          flat[key] = await flat[key];
          if (flat[key] === undefined) {
            delete flat[key];
          }
          return flat[key];
        }),
      );
      const result = unflatten(flat);
      return result;
    },
    [variables],
  );

  return {
    filter,
    refresh,
    getChartFilterFields,
    getFilter,
    hasFilter,
    appendFilter,
    getTranslatedTitle,
    parseFilter,
  };
};

export const useFilterVariable = () => {
  const { t: trans } = useChartsTranslation();
  const t = useMemoizedFn(trans);
  const { enabled, fields } = useContext(ChartFilterContext);
  const options = Object.entries(fields)
    .filter(([name, value]) => name.startsWith('custom.') && value)
    .map(([name, { title }]) => {
      const value = name.replace(/^custom\./, '');
      return {
        key: value,
        value,
        label: title,
      };
    });
  const result = useMemo(
    () => ({
      label: t('Current filter'),
      value: '$nFilter',
      key: '$nFilter',
      children: options,
    }),
    [options, t],
  );

  if (!enabled || !options.length) return null;

  return result;
};

export const useChartFilterSourceFields = () => {
  const { t } = useChartsTranslation();
  const { chartCollections } = useChartData();
  const dm = useDataSourceManager();
  const fim = dm.collectionFieldInterfaceManager;

  const { values } = useFieldComponents();
  const field2option = (cm: CollectionManager, field: any, depth: number) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = fim.getFieldInterface(field.interface);
    if (!fieldInterface?.filterable) {
      return;
    }
    const { nested } = fieldInterface.filterable;
    const item = {
      value: field.name,
      label: t(field?.uiSchema?.title || field.name),
    };
    if (field.target && depth > 2) {
      return;
    }
    if (depth > 2) {
      return item;
    }
    if (nested) {
      const targetFields = cm.getCollectionFields(field.target);
      const items = targetFields.map((targetField) => field2option(cm, targetField, depth + 1));
      return {
        value: field.name,
        label: t(field?.uiSchema?.title || field.name),
        children: items.filter((item: any) => item),
      };
    }
    if (!values.includes(field.uiSchema?.['x-component']) && !values.includes(field.interface)) {
      return;
    }
    return item;
  };

  return useMemo(() => {
    const options = Object.entries(chartCollections).map(([dataSource, collections]) => {
      const ds = dm.getDataSource(dataSource);
      return {
        value: dataSource,
        label: Schema.compile(ds.displayName, { t }),
        children: collections.map((name: string) => {
          const cm = ds.collectionManager;
          const collection = cm.getCollection(name);
          const fields = cm.getCollectionFields(name);
          const children = fields.map((field) => field2option(cm, field, 1)).filter((item) => item);
          return {
            value: name,
            label: Schema.compile(collection.title, { t }),
            children,
          };
        }),
      };
    });

    return options;
  }, [chartCollections]);
};

export const useFieldComponents = () => {
  const { t } = useChartsTranslation();
  const options = [
    { label: t('Input'), value: 'Input' },
    { label: t('Number'), value: 'InputNumber' },
    { label: t('Date'), value: 'DatePicker' },
    { label: t('Date range'), value: 'DatePicker.RangePicker' },
    { label: t('Time'), value: 'TimePicker' },
    { label: t('Time range'), value: 'TimePicker.RangePicker' },
    { label: t('Select'), value: 'Select' },
    { label: t('Radio group'), value: 'Radio.Group' },
    { label: t('Checkbox group'), value: 'Checkbox.Group' },
    // { label: t('China region'), value: 'chinaRegion' },
  ];
  return {
    options,
    values: options.map((option) => option.value),
  };
};

export const useCollectionJoinFieldTitle = (dataSource: string, name: string) => {
  const { t } = useChartsTranslation();
  const dm = useDataSourceManager();
  const { showDataSource } = useChartData();

  return useMemo(() => {
    const ds = dm.getDataSource(dataSource);
    if (!ds) {
      return;
    }
    const cm = ds.collectionManager;
    if (!name) {
      return;
    }
    const { fieldName } = parseFilterFieldName(name);
    const [collectionName, ...fieldNames] = fieldName.split('.');
    if (!fieldNames?.length) {
      return;
    }
    const collection = cm.getCollection(collectionName);
    let cName: any = collectionName;
    let field: any;
    let title = Schema.compile(collection?.title, { t });
    while (cName && fieldNames.length > 0) {
      const fileName = fieldNames.shift();
      field = cm.getCollectionField(`${cName}.${fileName}`);
      const fieldTitle = field?.uiSchema?.title || field?.name;
      if (fieldTitle) {
        title += ` / ${Schema.compile(fieldTitle, { t })}`;
      }
      if (field?.target) {
        cName = field.target;
      } else {
        cName = null;
      }
    }
    return showDataSource ? `${Schema.compile(ds.displayName, { t })} > ${title}` : title;
  }, [name, dataSource, showDataSource]);
};
