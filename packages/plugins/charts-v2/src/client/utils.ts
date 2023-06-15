import { uid } from '@formily/shared';
import { ChartLibraries, QueryProps } from './renderer';
import { FieldOption } from './hooks';
import { SelectedField } from './block';

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

export const getChart = (libraries: ChartLibraries, chartType: string) => {
  const [library, type] = (chartType || '-').split('-');
  return {
    library: libraries[library],
    chart: libraries[library]?.charts[type],
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

export const getQueryWithAlias = (fields: FieldOption[], query: QueryProps) => {
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
