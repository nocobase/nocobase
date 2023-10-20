import { SchemaInitializerItemOptions, isAssocField, useActionContext, useCollectionManager } from '@nocobase/client';
import { useContext } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { CollectionOptions } from '@nocobase/database';
import { Schema, useForm } from '@formily/react';
import { useChartsTranslation } from '../locale';

export const useCustomFieldInterface = () => {
  const { getInterface } = useCollectionManager();
  return {
    getSchemaByInterface: (fieldInterface: string) => {
      const defaultSchema = getInterface(fieldInterface)?.default.uiSchema;
      switch (fieldInterface) {
        case 'datetime':
          return {
            ...defaultSchema,
            'x-component-props': {
              ...defaultSchema['x-component-props'],

              showTime: true,
            },
          };
        default:
          return {
            ...defaultSchema,
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

  const getChartFilterFields = (collection: CollectionOptions) => {
    const name = collection.name;
    const fields = collection.fields || [];
    const collectionTitle = Schema.compile(collection.title, { t });

    return fields
      ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
      ?.map((field) => {
        const fieldTitle = Schema.compile(field.uiSchema?.title || field.name, { t });
        const interfaceConfig = getInterface(field.interface);
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
          'x-component-props': {},
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
        filter[collection] = filter[collection] || { $and: [] };
        filter[collection].$and.push({ [field]: { $eq: value } });
      });
    });
    return filter;
  };

  const filter = async () => {
    const filterValues = getFilter();
    const requests = Object.values(charts)
      .filter((chart) => {
        return chart && Object.keys(filterValues).includes(chart.collection);
      })
      .map((chart) => async () => {
        const { service, collection, query } = chart;
        let newQuery = { ...query };
        if (newQuery.filter) {
          newQuery = {
            ...newQuery,
            filter: {
              $and: [query.filter, filterValues[collection]],
            },
          };
        }
        await service.runAsync(collection, newQuery);
      });
    await Promise.all(requests.map((request) => request()));
  };

  const refresh = async () => {
    const filterValues = getFilter();
    const requests = Object.values(charts)
      .filter((chart) => {
        return chart && Object.keys(filterValues).includes(chart.collection);
      })
      .map((chart) => async () => {
        const { service, collection, query } = chart;
        await service.runAsync(collection, query);
      });
    await Promise.all(requests.map((request) => request()));
  };

  return {
    filter,
    refresh,
    getChartFilterFields,
  };
};

export const useChartFilterAction = () => {
  console.log('test');
  // const { filter } = useChartFilter();
  // return () => filter();
};
