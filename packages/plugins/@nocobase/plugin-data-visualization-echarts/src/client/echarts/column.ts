/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RenderProps } from '@nocobase/plugin-data-visualization/client';
import { EChart } from './echart';
import { lang } from '../locale';
import lodash from 'lodash';

export class Column extends EChart {
  constructor() {
    super({
      name: 'column',
      title: 'Column',
      series: { type: 'bar' },
      config: [
        {
          configType: 'select',
          name: 'labelPosition',
          title: lang('Label position'),
          defaultValue: 'top',
          options: [
            { label: lang('posTop'), value: 'top' },
            { label: lang('Inside'), value: 'inside' },
            { label: lang('Inside top'), value: 'insideTop' },
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
      ],
    });
    this.addConfigTypes({
      colorBy: {
        configType: 'select',
        name: 'colorBy',
        title: lang('Color by'),
        defaultValue: 'series',
        options: [
          { label: lang('Series'), value: 'series' },
          { label: lang('Data'), value: 'data' },
        ],
      },
      stack: {
        configType: 'radio',
        name: 'stack',
        title: lang('Stack'),
        componentProps: {
          optionType: 'button',
        },
        defaultValue: 'no',
        options: [
          { label: lang('No stack'), value: 'no' },
          { label: lang('Stack'), value: 'stack' },
          { label: lang('100% stack'), value: 'percent' },
        ],
      },
    });
  }

  getLabelOptions(config: { labelType: string; series: string; stack: string }) {
    const { labelType, series, stack } = config;
    let formatter: any;
    let showLabel = true;
    switch (Number(labelType)) {
      case 0:
        showLabel = false;
        break;
      case 1:
        if (stack === 'percent') {
          formatter = (params: any) => {
            const v = params.value[series];
            if (!v) {
              return '0%';
            }
            return Math.round(params.value[series] * 1000) / 10 + '%';
          };
        } else {
          formatter = `{@${series}}`;
        }
        break;
      case 2:
        formatter = '{a}';
        break;
      case 3:
        if (stack === 'percent') {
          formatter = (params: any) => {
            let v = params.value[series];
            if (!v) {
              return '0%';
            }
            v = Math.round(params.value[series] * 1000) / 10;
            return `${params.seriesName} ${v}%`;
          };
        } else {
          formatter = `{a} {@${series}}`;
        }
        break;
    }
    return { formatter, show: showLabel };
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const {
      xField,
      yFields,
      barWidth,
      barGap,
      barCategoryGap,
      colors,
      colorBy = 'series',
      stack,
      seriesField,
      labelType,
      labelPosition,
    } = general;
    const { min, max } = barWidth || {};
    const props = super.getProps({ data, general, advanced, fieldProps });
    props.tooltip.axisPointer = {
      type: 'shadow',
    };
    const color = colors?.filter((color: string) => color) || [];
    if (color.length) {
      props.color = color;
    }
    props.dataset.push({
      fromDatasetIndex: 1,
      transform: [
        {
          type: 'data-visualization:toPercent',
          config: { xField, stack, seriesField, yFields },
          print: true,
        },
      ],
    });
    props.series = props.series.map((series: any, index: number) => {
      const options: Record<string, any> = {
        ...lodash.omit(series, 'stack'),
        barMaxWidth: max,
        barMinWidth: min,
        colorBy,
        datasetIndex: 2,
        label: {
          ...this.getLabelOptions({ labelType, series: seriesField ? series.name : yFields[index], stack }),
          position: labelPosition,
        },
      };
      if (barGap) {
        options.barGap = `${barGap}%`;
      }
      if (barCategoryGap) {
        options.barCategoryGap = `${barCategoryGap}%`;
      }
      if (stack !== 'no') {
        options.stack = 'stack';
      }
      if (stack === 'percent') {
        options.tooltip = {
          valueFormatter: (value: number) => {
            if (!value) {
              return '0%';
            }
            return Math.round(value * 1000) / 10 + '%';
          },
        };
      }
      return options;
    });
    return props;
  }
}
