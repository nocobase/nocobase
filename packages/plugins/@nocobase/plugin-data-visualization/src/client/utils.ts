import { Schema } from '@formily/react';
import { uid } from '@formily/shared';
import { SelectedField } from './configure/ChartConfigure';
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
    'x-component-props': {
      size: 'small',
    },
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

// For AssociationField, the format of field is [targetField, field]
export const parseField = (field: string | string[]) => {
  let target: string;
  let name: string;
  if (!Array.isArray(field)) {
    name = field;
  } else if (field.length === 1) {
    name = field[0];
  } else if (field.length > 1) {
    [target, name] = field;
  }
  return { target, name, alias: target ? `${target}.${name}` : name };
};

export const getField = (fields: FieldOption[], field: string | string[]) => {
  const { target, name } = parseField(field);
  if (!target) {
    return fields.find((f) => f.name === name);
  }
  const targetField = fields.find((f) => f.name === target)?.targetFields?.find((f) => f.name === name);
  return targetField;
};

export const getSelectedFields = (fields: FieldOption[], query: QueryProps) => {
  // When field alias is set, appends it to the field list
  const process = (selectedFields: SelectedField[]) => {
    return selectedFields.map((selectedField) => {
      const fieldProps = getField(fields, selectedField.field);
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

export const processData = (selectedFields: FieldOption[], data: any[], scope: any) => {
  const parseEnum = (field: FieldOption, value: any) => {
    const options = field.uiSchema?.enum as { value: string; label: string }[];
    if (!options || !Array.isArray(options)) {
      return value;
    }
    const option = options.find((option) => option.value === value);
    return Schema.compile(option?.label || value, scope);
  };
  return data.map((record) => {
    const processed = {};
    Object.entries(record).forEach(([key, value]) => {
      const field = selectedFields.find((field) => field.value === key);
      if (!field) {
        processed[key] = value;
        return;
      }
      switch (field.interface) {
        case 'select':
        case 'radioGroup':
          processed[key] = parseEnum(field, value);
          break;
        default:
          processed[key] = value;
      }
    });
    return processed;
  });
};
