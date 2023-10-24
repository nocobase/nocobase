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
  const form = useForm();
  const { fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];
  const { getCollection, getInterface } = useCollectionManager();
  const { fields: fieldProps } = useContext(ChartFilterContext);

  const getChartFilterFields = (collection: CollectionOptions) => {
    const name = collection.name;
    const fields = collection.fields || [];
    const collectionTitle = Schema.compile(collection.title, { t });

    return fields
      ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
      ?.map((field) => {
        const fieldTitle = Schema.compile(field.uiSchema?.title || field.name, { t });
        const interfaceConfig = getInterface(field.interface);
        const defaultOperator = interfaceConfig?.filterable?.operators?.[0]?.value;
        const targetCollection = getCollection(field.target);
        let schema = {
          type: 'string',
          title: `${collectionTitle} / ${fieldTitle}`,
          name: `${name}.${field.name}`,
          required: false,
          'x-designer': 'ChartFilterItemDesigner',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': `${name}.${field.name}`,
          'x-component-props': {
            ...field.uiSchema?.['x-component-props'],
            filterOperator: defaultOperator,
          },
        };
        if (isAssocField(field)) {
          schema = {
            type: 'string',
            title: `${collectionTitle} / ${fieldTitle}`,
            name: `${name}.${field.name}`,
            required: false,
            'x-designer': 'ChartFilterItemDesigner',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
            'x-component-props': {
              ...field.uiSchema?.['x-component-props'],
              filterOperator: defaultOperator,
            },
          };
        }
        const resultItem = {
          type: 'item',
          title: field?.uiSchema?.title || field.name,
          component: 'CollectionFieldInitializer',
          remove: (schema, cb) => {
            cb(schema, {
              removeParentsIfNoChildren: true,
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
      });
  };

  const getFilter = () => {
    const values = form.values;
    const filter = {};
    Object.entries(values).forEach(([collection, fields]) => {
      Object.entries(fields).forEach(([field, value]) => {
        if (!value) {
          return;
        }
        const op = fieldProps[collection]?.[field]?.operator || '$eq';
        if (collection !== 'custom') {
          filter[collection] = filter[collection] || { $and: [] };
          filter[collection].$and.push({ [field]: { [op]: value } });
        } else {
          filter[collection] = filter[collection] || {};
          filter[collection][`$nFilter.${field}`] = value;
        }
      });
    });
    return filter;
  };

  const filter = async () => {
    const filterValues = getFilter();
    const requests = Object.values(charts)
      .filter((chart) => {
        const { query } = chart;
        const { parameters } = parse(query.filter || '');
        return (
          chart &&
          (filterValues[chart.collection] ||
            (filterValues['custom'] && parameters?.find((param: { key: string }) => filterValues['custom'][param.key])))
        );
      })
      .map((chart) => async () => {
        const { service, collection, query } = chart;
        let newQuery = { ...query };
        if (newQuery.filter) {
          let filter = newQuery.filter;
          const parsed = parse(filter);
          const { parameters } = parsed;
          if (
            filterValues['custom'] &&
            parameters?.find((param: { key: string }) => filterValues['custom'][param.key])
          ) {
            filter = parsed(filterValues['custom']);
          }
          newQuery = {
            ...newQuery,
            filter: {
              $and: [filter, filterValues[collection]],
            },
          };
        }
        await service.runAsync(collection, newQuery, true);
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
  };
};

export const useFilterVariable = () => {
  const { t: trans } = useChartsTranslation();
  const t = useMemoizedFn(trans);
  const {
    enabled,
    fields: { custom = [] },
  } = useContext(ChartFilterContext);
  const dateOptions = Object.entries(custom)
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
      children: dateOptions,
    }),
    [dateOptions, t],
  );

  if (!enabled) return null;

  return result;
};
