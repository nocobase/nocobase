import { SchemaInitializerItemOptions, i18n, useActionContext, useCollectionManager } from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { CollectionOptions } from '@nocobase/database';
import { Schema } from '@formily/react';
import { useChartsTranslation } from '../locale';
import { ChartFilterContext } from '../filter/FilterProvider';
import { useMemoizedFn } from 'ahooks';
import { parse } from '@nocobase/utils';
import lodash from 'lodash';
import { getValuesByPath } from '../utils';

export const useCustomFieldInterface = () => {
  const { getInterface } = useCollectionManager();
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

  const getChartCollections = () =>
    Array.from(
      new Set(
        Object.values(charts)
          .filter((chart) => chart)
          .map((chart) => chart.collection),
      ),
    );

  return {
    getChartCollections,
  };
};

export const useChartFilter = () => {
  const { charts } = useContext(ChartDataContext);
  const { fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];
  const { getCollection, getInterface, getCollectionFields, getCollectionField, getCollectionJoinField } =
    useCollectionManager();
  const { fields: fieldProps, form } = useContext(ChartFilterContext);

  const getChartFilterFields = (collection: CollectionOptions) => {
    const fields = getCollectionFields(collection);
    const field2item = (field: any, title: string, name: string) => {
      const fieldTitle = field.uiSchema?.title || field.name;
      const interfaceConfig = getInterface(field.interface);
      const defaultOperator = interfaceConfig?.filterable?.operators?.[0];
      const targetCollection = getCollection(field.target);
      let schema = {
        type: 'string',
        title: `${title} / ${fieldTitle}`,
        name: `${name}.${field.name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-component': 'CollectionField',
        'x-decorator': 'ChartFilterFormItem',
        'x-collection-field': `${name}.${field.name}`,
        'x-component-props': {
          ...field.uiSchema?.['x-component-props'],
          'filter-operator': defaultOperator,
        },
      };
      if (field.interface === 'formula') {
        schema = {
          ...schema,
          'x-component': 'InputNumber',
        };
      }
      const resultItem: SchemaInitializerItemOptions = {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
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

    const children2item = (child: any, title: string, name: string) => {
      const defaultOperator = child.operators[0];
      let schema = {
        type: 'string',
        name: `${name}.${child.name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-decorator': 'ChartFilterFormItem',
        'x-collection-field': `${name}.${child.name}`,
        ...child.schema,
        title: `${title} / ${child.title || child.name}`,
        'x-component-props': {
          'filter-operator': defaultOperator?.value,
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
      const resultItem: SchemaInitializerItemOptions = {
        type: 'item',
        title: child.title || child.name,
        component: 'CollectionFieldInitializer',
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

    const field2option = (field: any, depth: number, title: string, name: string) => {
      if (!field.interface) {
        return;
      }
      const fieldInterface = getInterface(field.interface);
      if (!fieldInterface?.filterable) {
        return;
      }
      const { nested, children } = fieldInterface.filterable;
      const fieldTitle = field.uiSchema?.title || field.name;
      const item = field2item(field, title, name);
      if (field.target && depth > 2) {
        return;
      }
      if (children?.length) {
        const items = children.map((child: any) =>
          children2item(child, `${title} / ${fieldTitle}`, `${name}.${field.name}`),
        );
        return {
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: items,
        };
      }
      if (!depth || depth > 2) {
        return item;
      }
      if (nested) {
        const targetFields = getCollectionFields(field.target);
        const items = targetFields.map((targetField) =>
          field2option(targetField, depth + 1, `${title} / ${fieldTitle}`, `${name}.${field.name}`),
        );
        return {
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: items,
        };
      }
      return item;
    };

    const options = [];
    const associationOptions = [];
    fields.forEach((field) => {
      const fieldInterface = field.interface;
      const option = field2option(field, 0, collection.title, collection.name);
      if (option) {
        options.push(option);
      }
      if (['m2o'].includes(fieldInterface)) {
        const option = field2option(field, 1, collection.title, collection.name);
        if (option) {
          associationOptions.push(option);
        }
      }
    });
    if (associationOptions.length) {
      options.push(
        {
          type: 'divider',
        },
        {
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
    Object.entries(fieldProps).forEach(([name, props]) => {
      const { operator } = props || {};
      const field = getCollectionJoinField(name);
      if (field?.target) {
        name = `${name}.${field.targetKey || 'id'}`;
      }
      const [collection, ...fields] = name.split('.');
      const value = getValuesByPath(values, name);
      const op = operator?.value || '$eq';
      if (collection !== 'custom') {
        filter[collection] = filter[collection] || { $and: [] };
        const condition = {};
        lodash.set(condition, fields.join('.'), { [op]: value });
        filter[collection].$and.push(condition);
      } else {
        filter[collection] = filter[collection] || {};
        filter[collection][`$nFilter.${fields.join('.')}`] = value;
      }
    });
    return filter;
  };

  const hasFilter = (chart: { collection: string; query: any }, filterValues: any) => {
    const { collection, query } = chart;
    const { parameters } = parse(query.filter || '');
    return (
      chart &&
      (filterValues[collection] ||
        (filterValues['custom'] && parameters?.find((param: { key: string }) => filterValues['custom'][param.key])))
    );
  };

  const appendFilter = (chart: { collection: string; query: any }, filterValues: any) => {
    const { collection, query } = chart;
    let newQuery = { ...query };
    if (newQuery.filter) {
      let filter = newQuery.filter;
      const parsed = parse(filter);
      const { parameters } = parsed;
      if (filterValues['custom'] && parameters?.find((param: { key: string }) => filterValues['custom'][param.key])) {
        filter = parsed(filterValues['custom']);
      }
      newQuery = {
        ...newQuery,
        filter: {
          $and: [filter, filterValues[collection]],
        },
      };
    }
    return newQuery;
  };

  const filter = async () => {
    const filterValues = getFilter();
    const requests = Object.values(charts)
      .filter((chart) => hasFilter(chart, filterValues))
      .map((chart) => async () => {
        const { service, collection } = chart;
        await service.runAsync(collection, appendFilter(chart, filterValues), true);
      });
    await Promise.all(requests.map((request) => request()));
  };

  const refresh = async () => {
    const requests = Object.values(charts)
      .filter((chart) => {
        return chart;
      })
      .map((chart) => async () => {
        const { service, collection, query } = chart;
        await service.runAsync(collection, query, true);
      });
    await Promise.all(requests.map((request) => request()));
  };

  const getTranslatedTitle = useMemoizedFn((title: string) => {
    return title
      .split(' / ')
      .map((item: string) => i18n.t(Schema.compile(item, { t: i18n.t })))
      .join(' / ');
  });

  return {
    filter,
    refresh,
    getChartFilterFields,
    getFilter,
    hasFilter,
    appendFilter,
    getTranslatedTitle,
  };
};

export const useFilterVariable = () => {
  const { t: trans } = useChartsTranslation();
  const t = useMemoizedFn(trans);
  const {
    enabled,
    fields: { custom = [] },
  } = useContext(ChartFilterContext);
  const options = Object.entries(custom)
    .filter(([_, value]) => value)
    .map(([name, { title }]) => {
      return {
        key: name,
        value: name,
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
