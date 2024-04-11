import transformers, { Transformer, TransformerConfig } from '../transformers';
import { lang } from '../locale';
import { ChartRendererProps } from '../renderer';
import { getSelectedFields } from '../utils';
import { FieldOption } from './query';

/**
 * useFieldTypes
 * Get field types for using transformers
 * Only supported types will be displayed
 * Some interfaces and types will be mapped to supported types
 */
export const useFieldTypes = (fields: FieldOption[]) => (field: any) => {
  const selectedField = field.query('.field').get('value');
  if (!selectedField) {
    field.setState({
      value: null,
      disabled: false,
    });
  }
  const query = field.query('query').get('value') || {};
  const selectedFields = getSelectedFields(fields, query);
  const fieldProps = selectedFields.find((field) => field.value === selectedField);
  const supports = Object.keys(transformers).filter((key) => key !== 'general');
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
  } else {
    field.setState({
      value: field.value,
      disabled: false,
    });
  }
};

export const useTransformers = (field: any) => {
  const selectedType = field.query('.type').get('value');
  if (!selectedType) {
    field.setValue(null);
    field.dataSource = [];
    return;
  }
  const options = Object.entries({ ...transformers.general, ...(transformers[selectedType] || {}) }).map(
    ([key, config]) => {
      const label = typeof config === 'function' ? key : config.label || key;
      return {
        label: lang(label),
        value: key,
      };
    },
  );
  field.dataSource = options;
};

export const useArgument = (field: any) => {
  const selectedType = field.query('.type').get('value');
  const format = field.query('.format').get('value');
  if (!format || !selectedType) {
    field.setComponentProps({
      schema: null,
    });
    return;
  }
  const config = transformers[selectedType][format] || transformers['general'][format];
  if (!config || typeof config === 'function') {
    field.setComponentProps({
      schema: null,
    });
    return;
  }
  field.setComponentProps({ schema: { name: format, ...config.schema } });
};

export const useFieldTransformer = (transform: ChartRendererProps['transform'], locale = 'en-US') => {
  const transformersMap: {
    [field: string]: {
      transformer: TransformerConfig;
      argument?: string | number;
    }[];
  } = (transform || [])
    .filter((item) => item.field && item.type && item.format)
    .reduce((mp, item) => {
      const transformer = transformers[item.type][item.format] || transformers.general[item.format];
      if (!transformer) {
        return mp;
      }
      mp[item.field] = [...(mp[item.field] || []), { transformer, argument: item.argument }];
      return mp;
    }, {});
  const result = {};
  Object.entries(transformersMap).forEach(([field, transformers]) => {
    result[field] = transformers.reduce(
      (fn: Transformer, config) => {
        const { transformer, argument } = config;
        return (val) => {
          try {
            if (typeof transformer === 'function') {
              return transformer(fn(val), locale);
            }
            return transformer.fn(fn(val), argument);
          } catch (e) {
            console.log(e);
            return val;
          }
        };
      },
      (val) => val,
    );
  });
  return result;
};
