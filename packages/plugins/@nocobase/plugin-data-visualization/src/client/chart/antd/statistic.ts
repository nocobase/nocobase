/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AntdChart } from './antd';
import { lang } from '../../locale';
import { ChartType, RenderProps } from '../chart';
import { Statistic as C } from './components/Statistic';

export class Statistic extends AntdChart {
  constructor() {
    super({
      name: 'statistic',
      title: 'Statistic',
      enableAdvancedConfig: true,
      Component: C,
      config: [
        {
          configType: 'field',
          name: 'field',
          title: 'Field',
          required: true,
        },
        {
          title: {
            title: lang('Title'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
        {
          link: {
            title: lang('Link'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      ],
    });
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { yField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        field: yField?.value,
        title: yField?.label,
      },
    };
  };

  getProps({ data, fieldProps, general, advanced }: RenderProps) {
    const record = data[0] || {};
    const field = general?.field;
    const props = fieldProps[field];
    return {
      value: record[field],
      formatter: props?.transformer,
      ...general,
      ...advanced,
    };
  }
}
