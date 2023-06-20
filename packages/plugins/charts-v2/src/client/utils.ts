import { uid } from '@formily/shared';
import { SelectedField } from './block';
import { FieldOption } from './hooks';
import { QueryProps } from './renderer';

export const createRendererSchema = (decoratorProps: any, componentProps = {}) => {
  const { collection } = decoratorProps;
  return {
    type: 'void',
    'x-decorator': 'ChartRendererProvider',
    'x-decorator-props': decoratorProps,
    'x-acl-action': `${collection}:list`,
    'x-designer': 'ChartRenderer.Designer',
    'x-component': 'CardItem',
    'x-initializer': 'ChartInitializers',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'ChartRenderer',
        'x-component-props': componentProps,
      },
    },
  };
};

export const getSelectedFields = (fields: FieldOption[], query: QueryProps) => {
  // When field alias is set, appends it to the field list
  const process = (selectedFields: SelectedField[]) => {
    return selectedFields.map((selectedField) => {
      const fieldProps = fields.find((field) => field.name === selectedField.field);
      return {
        ...fieldProps,
        key: selectedField.alias || fieldProps?.key,
        label: selectedField.alias || fieldProps?.label,
        value: selectedField.alias || fieldProps?.value,
      };
    });
  };
  const measures = query.measures || [];
  const dimensions = query.dimensions || [];
  // unique
  const map = new Map([...process(measures), ...process(dimensions)].map((item) => [item.value, item]));
  const selectedFields = [...map.values()];
  return selectedFields;
};

export const processData = (fields: FieldOption[], data: any[]) => {
  const parseEnum = (field: FieldOption, value: any) => {
    const options = field.uiSchema?.enum as { value: string; label: string }[];
    if (!options || !Array.isArray(options)) {
      return value;
    }
    const option = options.find((option) => option.value === value);
    return option?.label || value;
  };
  return data.map((record) => {
    const processed = {};
    Object.entries(record).forEach(([key, value]) => {
      const field = fields.find((field) => field.name === key);
      if (!field) {
        processed[key] = value;
        return;
      }
      const label = field.label || key;
      switch (field.interface) {
        case 'select':
        case 'radioGroup':
          processed[label] = parseEnum(field, value);
          break;
        default:
          processed[label] = value;
      }
    });
    return processed;
  });
};
