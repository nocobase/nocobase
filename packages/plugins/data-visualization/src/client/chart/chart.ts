import React from 'react';
import { FieldOption } from '../hooks';
import { QueryProps } from '../renderer';
import { parseField } from '../utils';
import { ISchema } from '@formily/react';

export type RenderProps = {
  data: any[];
  general: any;
  advanced: any;
  fieldProps: {
    [field: string]: FieldOption & {
      transformer: (val: any) => string;
    };
  };
};

export interface ChartType {
  name: string;
  title: string;
  component: React.FC<any>;
  schema: ISchema;
  infer: (
    fields: FieldOption[],
    {
      measures,
      dimensions,
    }: {
      measures?: QueryProps['measures'];
      dimensions?: QueryProps['dimensions'];
    },
  ) => {
    xField: FieldOption;
    yField: FieldOption;
    seriesField: FieldOption;
    yFields: FieldOption[];
  };
  init?: (
    fields: FieldOption[],
    query: {
      measures?: QueryProps['measures'];
      dimensions?: QueryProps['dimensions'];
    },
  ) => {
    general?: any;
    advanced?: any;
  };
  /**
   * getProps
   * Accept the information that the chart component needs to render,
   * process it and return the props of the chart component.
   */
  getProps: (props: RenderProps) => any;
  getReference?: () => {
    title: string;
    link: string;
  };
  render: (props: RenderProps) => React.FC<any>;
}

export class Chart implements ChartType {
  name: string;
  title: string;
  component: React.FC<any>;
  schema = {};

  constructor(name: string, title: string, component: React.FC<any>) {
    this.name = name;
    this.title = title;
    this.component = component;
  }

  infer(
    fields: FieldOption[],
    {
      measures,
      dimensions,
    }: {
      measures?: QueryProps['measures'];
      dimensions?: QueryProps['dimensions'];
    },
  ) {
    let xField: FieldOption;
    let yField: FieldOption;
    let seriesField: FieldOption;
    let yFields: FieldOption[];
    const getField = (fields: FieldOption[], selected: { field: string | string[]; alias?: string }) => {
      if (selected.alias) {
        return fields.find((f) => f.value === selected.alias);
      }
      const { alias } = parseField(selected.field);
      return fields.find((f) => f.value === alias);
    };
    if (measures?.length) {
      yField = getField(fields, measures[0]);
      yFields = measures.map((m) => getField(fields, m));
    }
    if (dimensions) {
      if (dimensions.length === 1) {
        xField = getField(fields, dimensions[0]);
      } else if (dimensions.length > 1) {
        // If there is a time field, it is used as the x-axis field by default.
        let xIndex: number;
        dimensions.forEach((d, i) => {
          const field = getField(fields, d);
          if (['date', 'time', 'datetime'].includes(field?.type)) {
            xField = field;
            xIndex = i;
          }
        });
        if (xIndex) {
          // If there is a time field, the other field is used as the series field by default.
          const index = xIndex === 0 ? 1 : 0;
          seriesField = getField(fields, dimensions[index]);
        } else {
          xField = getField(fields, dimensions[0]);
          seriesField = getField(fields, dimensions[1]);
        }
      }
    }
    return { xField, yField, seriesField, yFields };
  }

  getProps(props: RenderProps) {
    return props;
  }

  render({ data, general, advanced, fieldProps }: RenderProps) {
    return () =>
      React.createElement(this.component, {
        ...this.getProps({ data, general, advanced, fieldProps }),
      });
  }
}
