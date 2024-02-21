import { SchemaInitializerItemType, i18n, useActionContext, useCollectionManager_deprecated } from '@nocobase/client';
import { useContext, useMemo } from 'react';
import { ChartDataContext } from '../block/ChartDataProvider';
import { CollectionOptions } from '@nocobase/database';
import { Schema } from '@formily/react';
import { useChartsTranslation } from '../locale';
import { ChartFilterContext } from '../filter/FilterProvider';
import { useMemoizedFn } from 'ahooks';
import { parse } from '@nocobase/utils/client';
import lodash from 'lodash';
import { getFormulaComponent, getValuesByPath } from '../utils';
import deepmerge from 'deepmerge';

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
  const { getCollection, getInterface, getCollectionFields, getCollectionJoinField } =
    useCollectionManager_deprecated();
  const { fields: fieldProps, form } = useContext(ChartFilterContext);

  const getChartFilterFields = (collection: CollectionOptions) => {
    const fields = getCollectionFields(collection);
    const field2item = (field: any, title: string, name: string) => {
      const fieldTitle = field.uiSchema?.title || field.name;
      const interfaceConfig = getInterface(field.interface);
      const defaultOperator = interfaceConfig?.filterable?.operators?.[0];
      const targetCollection = getCollection(field.target);
      title = title ? `${title} / ${fieldTitle}` : fieldTitle;
      let schema = {
        type: 'string',
        title,
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
        const component = getFormulaComponent(field.dataType) || 'Input';
        schema = {
          ...schema,
          'x-component': component,
        };
      }
      if (['oho', 'o2m'].includes(field.interface)) {
        schema['x-component-props'].useOriginalFilter = true;
      }
      const resultItem: SchemaInitializerItemType = {
        key: `${name}.${field.name}`,
        name: field.name,
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        Component: 'CollectionFieldInitializer',
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
      const childTitle = child.uiSchema?.title || child.name;
      title = title ? `${title} / ${childTitle}` : childTitle;
      const defaultOperator = child.operators[0];
      let schema = {
        type: 'string',
        name: `${name}.${child.name}`,
        required: false,
        'x-designer': 'ChartFilterItemDesigner',
        'x-decorator': 'ChartFilterFormItem',
        'x-collection-field': `${name}.${child.name}`,
        ...child.schema,
        title,
        'x-component-props': {
          'filter-operator': defaultOperator,
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

    const field2option = (field: any, depth: number, title: string, name: string): SchemaInitializerItemType => {
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
      title = title ? `${title} / ${fieldTitle}` : fieldTitle;
      if (children?.length && !['chinaRegion', 'createdBy', 'updatedBy'].includes(field.interface)) {
        const items = children.map((child: any) => children2item(child, title, `${name}.${field.name}`));
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
        const targetFields = getCollectionFields(field.target);
        const items = targetFields.map((targetField) =>
          field2option(targetField, depth + 1, '', `${name}.${field.name}`),
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
      const option = field2option(field, 0, '', collection.name);
      if (option) {
        options.push(option);
      }
      if (['m2o'].includes(fieldInterface)) {
        const option = field2option(field, 1, '', collection.name);
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
        $and: [filter, filterValues[collection]],
      },
    };
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
  const { getChartCollections } = useChartData();
  const { getInterface, getCollectionFields, getCollection } = useCollectionManager_deprecated();
  const { values } = useFieldComponents();
  const field2option = (field: any, depth: number) => {
    if (!field.interface) {
      return;
    }
    const fieldInterface = getInterface(field.interface);
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
      const targetFields = getCollectionFields(field.target);
      const items = targetFields.map((targetField) => field2option(targetField, depth + 1));
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

  const collections = getChartCollections();
  return useMemo(() => {
    const options = [];
    collections.forEach((name) => {
      const collection = getCollection(name);
      const children = [];
      const fields = getCollectionFields(collection);
      fields.forEach((field) => {
        const option = field2option(field, 1);
        if (option) {
          children.push(option);
        }
      });
      if (children.length) {
        options.push({
          value: name,
          label: t(collection.title),
          children,
        });
      }
    });
    return options;
  }, [collections]);
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

export const useCollectionJoinFieldTitle = (name: string) => {
  const { getCollection, getCollectionField } = useCollectionManager_deprecated();
  return useMemo(() => {
    if (!name) {
      return;
    }
    const [collectionName, ...fieldNames] = name.split('.');
    if (!fieldNames?.length) {
      return;
    }
    const collection = getCollection(collectionName);
    let cName: any = collectionName;
    let field: any;
    let title = Schema.compile(collection?.title, { t: i18n.t });
    while (cName && fieldNames.length > 0) {
      const fileName = fieldNames.shift();
      field = getCollectionField(`${cName}.${fileName}`);
      const fieldTitle = field?.uiSchema?.title || field?.name;
      if (fieldTitle) {
        title += ` / ${Schema.compile(fieldTitle, { t: i18n.t })}`;
      }
      if (field?.target) {
        cName = field.target;
      } else {
        cName = null;
      }
    }
    return title;
  }, [name]);
};
