/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { EChart } from './echart';
import { lang } from '../locale';

export class Treemap extends EChart {
  constructor() {
    super({
      name: 'treemap',
      title: lang('Treemap'),
      series: { type: 'treemap' },
    });
    this.config = ['size', 'lightTheme', 'darkTheme', 'labelType'];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: xField?.value,
        yField: yField?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { showLegend, labelType, showLabelLine, labelPosition, xField, yField } = general;
    let formatter: string;
    let showLabel = true;
    switch (Number(labelType)) {
      case 0:
        showLabel = false;
        break;
      case 1:
        formatter = `{@${yField}}`;
        break;
      case 2:
        formatter = '{b}';
        break;
      case 3:
        formatter = `{b} {@${yField}}`;
        break;
    }
    data = data.map((item) => ({ name: item[xField], value: item[yField] }));
    const options = {
      legend: {
        show: false,
      },
      tooltip: {},
      series: {
        name: fieldProps[yField]?.label,
        data,
        label: {
          position: labelPosition,
          show: showLabel,
          formatter,
        },
        labelLine: {
          show: showLabelLine,
        },
        ...this.series,
      },
      ...this.getBasicOptions({ general }),
    };
    return options;
  }
}
