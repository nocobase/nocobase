/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RenderProps } from '@nocobase/plugin-data-visualization/client';
import { Column } from './column';
import { lang } from '../locale';

export class Bar extends Column {
  constructor() {
    super();
    this.name = 'bar';
    this.title = 'Bar';
    this.config = [
      {
        configType: 'field',
        name: 'xField',
        title: 'yField',
        required: true,
      },
      'seriesField',
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      'legendOrient',
      'legendPosition',
      'labelType',
      {
        configType: 'select',
        name: 'labelPosition',
        title: lang('Label position'),
        defaultValue: 'right',
        options: [
          { label: lang('posRight'), value: 'right' },
          { label: lang('Inside'), value: 'inside' },
          { label: lang('Inside right'), value: 'insideRight' },
        ],
      },
      'stack',
      'barWidth',
      {
        configType: 'percent',
        name: 'barGap',
        title: lang('Bar gap'),
      },
      {
        configType: 'percent',
        name: 'barCategoryGap',
        title: lang('Bar category gap'),
      },
      'colorBy',
      'colors',
      {
        configType: 'axisTitle',
        name: 'xAxisTitle',
        title: lang('X-Axis title'),
        defaultValue: 'end',
      },
      {
        configType: 'axisTitle',
        name: 'yAxisTitle',
        title: lang('Y-Axis title'),
        defaultValue: 'end',
      },
      {
        configType: 'boolean',
        name: 'yAxisInverse',
        title: lang('Y-Axis inverse'),
        defaultValue: false,
      },
      {
        configType: 'axisLabelRotate',
        name: 'yAxisLabelRotate',
        title: lang('Y-Axis label rotate'),
      },
      'padding',
      {
        configType: 'splitLine',
        defaultValue: 'x',
      },
    ];
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const {
      yAxisLabelRotate = 0,
      xAxisTitle = 'end',
      yAxisTitle = 'end',
      yFields,
      seriesField,
      yAxisInverse,
    } = general;
    const props = super.getProps({ data, general, advanced, fieldProps });
    const xLabel = fieldProps[general.xField]?.label;
    const yLabel = fieldProps[general.yField]?.label;
    const showXAxisTitle = xAxisTitle !== 'none' && (yFields.length === 1 || seriesField);
    props.xAxis = {
      ...props.xAxis,
      type: 'value',
      name: showXAxisTitle ? yLabel : '',
      nameLocation: xAxisTitle,
      nameGap: xAxisTitle === 'end' ? 15 : 30,
    };
    props.yAxis = {
      ...props.yAxis,
      inverse: yAxisInverse,
      type: 'category',
      name: yAxisTitle !== 'none' ? xLabel : '',
      nameLocation: yAxisTitle,
      nameGap: yAxisTitle === 'middle' ? 50 : 15,
      axisLabel: {
        rotate: yAxisLabelRotate,
      },
    };
    props.series = props.series.map((item: any) => ({
      ...item,
      label: {
        ...item.label,
        position: general.labelPosition || 'right',
      },
    }));
    return props;
  }
}
