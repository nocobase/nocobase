import { Schema } from '@formily/react';
import { CollectionOptions, SchemaInitializerItemOptions, i18n, isAssocField } from '@nocobase/client';

export const getCollectionsFromChartBlock = (schema: Schema) => {
  const getChartBlock = (schema: any) => {
    return schema['x-decorator'] === 'ChartV2Block' ? schema : schema.parent ? getChartBlock(schema.parent) : [];
  };
  const chartBlock = getChartBlock(schema);
  return chartBlock.reduceProperties((collections: any, row: any) => {
    row.reduceProperties((_: any, col: any) => {
      col.reduceProperties((_: any, chart: any) => {
        if (chart['x-decorator'] === 'ChartRendererProvider') {
          const collection = chart['x-decorator-props'].collection;
          if (!collections.includes(collection)) {
            collections.push(collection);
          }
        }
      });
    });
    return collections;
  }, []);
};

export const getChartFilterFields = (
  collection: CollectionOptions,
  form: any,
  action: string,
  getInterface: any,
  getCollection: any,
) => {
  const name = collection.name;
  const fields = collection.fields || [];
  const collectionTitle = Schema.compile(collection.title, { t: i18n.t });

  return fields
    ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
    ?.map((field) => {
      const fieldTitle = Schema.compile(field.uiSchema?.title || field.name, { t: i18n.t });
      const interfaceConfig = getInterface(field.interface);
      const targetCollection = getCollection(field.target);
      let schema = {
        type: 'string',
        title: `${collectionTitle} / ${fieldTitle}`,
        name: `${collection.name}.${field.name}`,
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
          name: `${collection.name}.${field.name}`,
          required: false,
          'x-designer': 'ChartFilterItemDesigner',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': `${name}.${field.name}`,
          'x-component-props': field.uiSchema?.['x-component-props'],
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
