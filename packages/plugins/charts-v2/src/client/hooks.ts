import { useContext } from 'react';
import { ChartConfigContext, SelectedField } from './block/ChartConfigure';
import { useACLRoleContext, useCollectionManager } from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { operators } from '@nocobase/client';
import formatters from './block/formatters';
import transformers from './block/transformers';
import { lang } from './locale';
import { ChartRendererProps, QueryProps } from './renderer';

export type FieldOption = {
  value: string;
  label: string;
  key: string;
  alias?: string;
  name?: string;
  type?: string;
  interface?: string;
  uiSchema?: ISchema;
};

export const useFields = (collection?: string) => {
  const { current } = useContext(ChartConfigContext);
  if (!collection) {
    collection = current?.collection || '';
  }
  const { getCollectionFields } = useCollectionManager();
  const fields = (getCollectionFields(collection) || [])
    .filter((field) => {
      return !['belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(field.type) && field.interface;
    })
    .map((field) => ({
      key: field.name,
      label: field.uiSchema?.title || field.name,
      value: field.name,
      ...field,
    }));
  return fields;
};

export const useCompiledFields = (collection?: string) => {
  const fields = useFields(collection);
  const { t } = useTranslation();
  return Schema.compile(fields, { t }) as FieldOption[];
};

export const getAllFields = (fields: FieldOption[], field: any) => {
  // When field alias is set, appends it to the field list
  const appendAlias = (selectedFields: SelectedField[]) => {
    return selectedFields
      .filter((selectedField) => selectedField.alias)
      .map((selectedField) => {
        const fieldProps = fields.find((field) => field.name === selectedField.field);
        return {
          ...fieldProps,
          key: selectedField.alias,
          label: selectedField.alias,
          value: selectedField.alias,
        };
      });
  };
  const query = field.query('query').get('value') || {};
  const measures = query.measures || [];
  const dimensions = query.dimensions || [];
  const aliasFields = [...appendAlias(measures), ...appendAlias(dimensions)];
  // unique
  const map = new Map([...fields, ...aliasFields].map((item) => [item.value, item]));
  const allFields = [...map.values()];
  return allFields;
};

export const useChartFields =
  (fields: FieldOption[], scope = {}) =>
  (field: any) => {
    const allFields = getAllFields(fields, field);
    /**
     * chartFields is used for configuring chart fields
     * since the default alias is field display name, we need to set the option values to field display name
     * see also: 'useQueryWithAlias'
     */
    const chartFields = allFields.map((field) => ({
      ...field,
      label: Schema.compile(field.label, scope),
      value: field.label,
    }));
    console.log(chartFields);
    field.dataSource = chartFields;
  };

export const useFormatters = (fields: FieldOption[]) => (field: any) => {
  const selectedField = field.query('.field').get('value');
  if (!selectedField) {
    field.dataSource = [];
    return;
  }
  let options = [];
  const fieldInterface = fields.find((field) => field.name === selectedField)?.interface;
  switch (fieldInterface) {
    case 'datetime':
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
  const { collections } = useCollectionManager();
  const { allowAll, parseAction } = useACLRoleContext();
  const options = collections
    .filter((collection: { name: string }) => {
      if (allowAll) {
        return true;
      }
      const params = parseAction(`${collection.name}:list`);
      return params;
    })
    .map((collection: { name: string; title: string }) => ({
      label: collection.title,
      value: collection.name,
      key: collection.name,
    }));
  return Schema.compile(options, { t });
};

/**
 * useFieldTypes
 * Get field types for using transformers
 * Only supported types will be displayed
 * Some interfaces and types will be mapped to supported types
 */
export const useFieldTypes = (fields: FieldOption[]) => (field: any) => {
  const selectedField = field.query('.field').get('value');
  const allFields = getAllFields(fields, field);
  const fieldProps = allFields.find((field) => field.label === selectedField);
  const supports = Object.keys(transformers);
  field.dataSource = supports.map((key) => ({
    label: lang(key),
    value: key,
  }));
  const map = {
    createdAt: 'datetime',
    updatedAt: 'datetime',
    double: 'number',
    integer: 'number',
  };
  const fieldInterface = fieldProps?.interface;
  const fieldType = fieldProps?.type;
  const key = map[fieldInterface] || map[fieldType] || fieldType;
  if (supports.includes(key)) {
    field.setState({
      value: key,
      disabled: true,
    });
    return;
  }
  field.setState({
    value: null,
    disabled: false,
  });
};

export const useTransformers = (field: any) => {
  const selectedType = field.query('.type').get('value');
  if (!selectedType) {
    field.dataSource = [];
    return;
  }
  const options = Object.keys(transformers[selectedType] || {}).map((key) => ({
    label: lang(key),
    value: key,
  }));
  field.dataSource = options;
};

export const useQueryWithAlias = (fields: FieldOption[], query: QueryProps) => {
  // If alias is not set, use field title (display name instead of field name) as alias
  const appendAlias = (selectedFields: SelectedField[]) => {
    return selectedFields
      .filter((item) => item.field)
      .map((item) => {
        const field = fields.find((field) => field.name === item.field);
        return {
          ...item,
          alias: item.alias || field?.label,
        };
      });
  };
  const { dimensions = [], measures = [] } = query || {};
  return {
    ...query,
    dimensions: appendAlias(dimensions),
    measures: appendAlias(measures),
  };
};

export const useFieldTransformer = (transform: ChartRendererProps['transform'], locale = 'en-US') => {
  return (transform || [])
    .filter((item) => item.field && item.type && item.format)
    .reduce((meta, item) => {
      const formatter = transformers[item.type][item.format];
      if (!formatter) {
        return meta;
      }
      meta[item.field] = {
        formatter: (val: any) => formatter(val, locale),
      };
      return meta;
    }, {});
};
