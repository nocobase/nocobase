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

export class Line extends EChart {
  constructor() {
    super({
      name: 'line',
      title: 'Line',
      series: { type: 'line' },
      config: [
        'smooth',
        'isStack',
        {
          configType: 'select',
          name: 'symbol',
          title: lang('Symbol'),
          defaultValue: 'circle',
          options: [
            { label: lang('None'), value: 'none' },
            { label: '●', value: 'circle' },
            { label: '◯', value: 'emptyCircle' },
            { label: '◼', value: 'rect' },
            { label: '▢', value: 'emptyRect' },
            { label: '▲', value: 'triangle' },
            { label: '△', value: 'emptyTriangle' },
            { label: '◆', value: 'diamond' },
            { label: '◇', value: 'emptyDiamond' },
          ],
        },
      ],
    });
  }

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const { symbol } = general;
    const props = super.getProps({ data, general, advanced, fieldProps });
    props.series = props.series.map((series: any) => ({
      symbol,
      ...series,
    }));
    return props;
  }
}
