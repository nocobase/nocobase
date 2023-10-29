import { SchemaInitializerItemOptions, isAssocField, useActionContext, useCollectionManager } from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { CollectionOptions } from '@nocobase/database';
import { Schema, useForm } from '@formily/react';
import { useChartsTranslation } from '../locale';
import { ChartFilterContext } from '../filter/FilterProvider';
import { useMemoizedFn } from 'ahooks';
import { parse } from '@nocobase/utils';

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
  const { t } = useChartsTranslation();
  const { charts } = useContext(ChartDataContext);
  const { fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];
  const { getCollection, getInterface, getCollectionFields } = useCollectionManager();
  const { fields: fieldProps, form } = useContext(ChartFilterContext);

  const getChartFilterFields = (collection: CollectionOptions) => {
    const fields = getCollectionFields(collection);
    const field2item = (field: any, collectionTitle: string, collectionName: string) => {
      const fieldTitle = Schema.compile(field.uiSchema?.title || field.name, { t });
      const interfaceConfig = getInterface(field.interface);
      const defaultOperator = interfaceConfig?.filterable?.operators?.[0];
      const targetCollection = getCollection(field.target);
      const schema = {
        type: 'string',
        title: `${collectionTitle} / ${fieldTitle}`,
        name: `${collectionName}.${field.name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-component': 'CollectionField',
        'x-decorator': 'ChartFilterFormItem',
        'x-collection-field': `${collectionName}.${field.name}`,
        'x-component-props': {
          ...field.uiSchema?.['x-component-props'],
          'filter-operator': defaultOperator,
        },
      };
      const resultItem = {
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
      } as SchemaInitializerItemOptions;

      return resultItem;
    };

    const collectionTitle = Schema.compile(collection.title, { t });
    return fields
      ?.filter((field) => field?.interface && getInterface(field.interface)?.filterable)
      ?.map((field) => {
        const item = field2item(field, collectionTitle, collection.name);
        if (!field.target) {
          return item;
        }
        const targetFields = getCollectionFields(field.target);
        const targetTitle = Schema.compile(item['title'], { t });
        const items = targetFields
          ?.filter(
            (targetField) =>
              !targetField.target && targetField?.interface && getInterface(targetField.interface)?.filterable,
          )
          ?.map((targetField) => {
            return field2item(targetField, `${collectionTitle} / ${targetTitle}`, `${collection.name}.${field.name}`);
          });
        return {
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: items,
        } as SchemaInitializerItemOptions;
      });
  };

  const getFilter = () => {
    const values = form?.values || {};
    const filter = {};
    Object.entries(values).forEach(([collection, fields]) => {
      Object.entries(fields).forEach(([field, value]) => {
        if (!value) {
          return;
        }
        let target: string;
        let name: string;
        if (typeof value === 'object' && !Array.isArray(value)) {
          target = field;
          name = Object.keys(value)[0];
          field = `${target}.${name}`;
          value = Object.values(value)[0];
          if (!value) {
            return;
          }
        }
        const operator = fieldProps[collection]?.[field]?.operator;
        const op = operator?.value || '$eq';
        if (collection !== 'custom') {
          filter[collection] = filter[collection] || { $and: [] };
          if (name) {
            filter[collection].$and.push({ [target]: { [name]: { [op]: value } } });
          } else {
            filter[collection].$and.push({ [field]: { [op]: value } });
          }
        } else {
          filter[collection] = filter[collection] || {};
          filter[collection][`$nFilter.${field}`] = value;
        }
      });
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

  return {
    filter,
    refresh,
    getChartFilterFields,
    getFilter,
    hasFilter,
    appendFilter,
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
