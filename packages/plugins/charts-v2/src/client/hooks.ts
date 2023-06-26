import { ISchema, Schema } from '@formily/react';
import { useACLRoleContext, useCollectionManager } from '@nocobase/client';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartConfigContext } from './block/ChartConfigure';
import formatters from './block/formatters';
import transformers from './block/transformers';
import { lang } from './locale';
import { ChartRendererProps } from './renderer';
import { getField, getSelectedFields } from './utils';

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

export const useFields = (collection?: string) => {
  const { current } = useContext(ChartConfigContext);
  if (!collection) {
    collection = current?.collection || '';
  }
  const { getCollectionFields } = useCollectionManager();
  const fields = (getCollectionFields(collection) || [])
    .filter((field) => {
      return field.interface;
    })
    .map((field) => ({
      key: field.name,
      label: field.uiSchema?.title || field.name,
      value: field.name,
      ...field,
    }));
  return fields;
};

export const useFieldsWithAssociation = (collection?: string) => {
  const { getCollectionFields } = useCollectionManager();
  const { t } = useTranslation();
  const fields = useFields(collection);
  return fields.map((field) => {
    const label = Schema.compile(field.uiSchema?.title || field.name, { t });
    if (!field.target) {
      return { ...field, label };
    }
    const targetFields = (getCollectionFields(field.target) || [])
      .filter((targetField) => {
        return targetField.interface;
      })
      .map((targetField) => ({
        key: targetField.name,
        label: `${label} / ${Schema.compile(targetField.uiSchema?.title || targetField.name, { t })}`,
        value: `${field.name}.${targetField.name}`,
        ...targetField,
      }));
    return {
      ...field,
      label,
      targetFields,
    };
  });
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
  const query = field.query('query').get('value') || {};
  const selectedFields = getSelectedFields(fields, query);
  const fieldProps = selectedFields.find((field) => field.value === selectedField);
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
    percent: 'number',
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

export const useFieldTransformer = (transform: ChartRendererProps['transform'], locale = 'en-US') => {
  return (transform || [])
    .filter((item) => item.field && item.type && item.format)
    .reduce((mp, item) => {
      console.log(item.type, item.format);
      const transformer = transformers[item.type][item.format];
      if (!transformer) {
        return mp;
      }
      mp[item.field] = (val: any) => transformer(val, locale);
      return mp;
    }, {});
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
