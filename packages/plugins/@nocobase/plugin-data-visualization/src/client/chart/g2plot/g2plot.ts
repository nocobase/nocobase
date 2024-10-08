/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Chart, ChartProps, ChartType, RenderProps } from '../chart';
import { getAntChart } from './AntChart';

export class G2PlotChart extends Chart {
  constructor({ name, title, Component, config }: ChartProps) {
    super({
      name,
      title,
      enableAdvancedConfig: true,
      Component: getAntChart(Component),
      config: ['xField', 'yField', 'seriesField', 'size', ...(config || [])],
    });
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
        seriesField: seriesField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const xFieldProps = fieldProps[general.xField];
    const yFieldProps = fieldProps[general.yField];
    const seriesFieldProps = fieldProps[general.seriesField];
    const config = {
      legend: {
        color: {
          itemLabelText: (datnum: { label: string }) => {
            const transformer = seriesFieldProps?.transformer;
            return transformer ? transformer(datnum.label) : datnum.label;
          },
        },
      },
      tooltip: {
        title: (data: any) => {
          const { [general.xField]: x } = data;
          return xFieldProps?.transformer ? xFieldProps.transformer(x) : x;
        },
        items: [
          (data: any) => {
            const { [general.xField]: x, [general.yField]: y, [general.seriesField]: series } = data;
            let name = '';
            if (series) {
              name = seriesFieldProps.transformer ? seriesFieldProps.transformer(series) : series;
            } else {
              name = yFieldProps?.label || general.yField;
            }
            return {
              name,
              value: yFieldProps?.transformer ? yFieldProps.transformer(y) : y,
            };
          },
        ],
      },
      axis: {
        x: {
          labelFormatter: (datnum: any) => {
            const transformer = xFieldProps?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
        y: {
          labelFormatter: (datnum: any) => {
            const transformer = yFieldProps?.transformer;
            return transformer ? transformer(datnum) : datnum;
          },
        },
      },
      data,
      animate: {
        enter: {
          type: false,
        },
        update: {
          type: false,
        },
        exit: {
          type: false,
        },
      },
      colorField: general.seriesField,
      stack: general.isStack,
      percent: general.isPercent ? true : undefined,
      ...(general.smooth ? { shapeField: 'smooth' } : {}),
      ...general,
      seriesField: general.isGroup ? general.seriesField : undefined,
      ...advanced,
    };
    return config;
  }

  getReference() {
    return {
      title: this.title,
      link: `https://ant-design-charts-next.antgroup.com/examples#statistics-${this.name}`,
    };
  }
}
