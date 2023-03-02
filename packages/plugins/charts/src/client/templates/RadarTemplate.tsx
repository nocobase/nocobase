import { i18n } from '@nocobase/client';
import JSON5 from 'json5';
import React from 'react';
import { lang } from '../locale';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON5.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
message: '{{t("Invalid JSON format",{ ns: "charts" })}}',
};

const chartConfig = {
  _xType: 'Radar',
  xField: '{{dimension}}',
  yField: '{{metric}}',
  appendPadding: [0, 10, 0, 10],
  xAxis: {
    tickLine: null,
  },
  yAxis: {
    label: false,
    grid: {
      alternateColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  // 开启辅助点
  point: {
    size: 2,
  },
  area: {},
};
export const radarTemplate = {
  description: '1~ 2 「Unordered Noun」 fields, 1 「Numeric」 field',
  type: 'Radar',
  title: 'Radar',
  iconId: 'icon-radar',
  group: 1,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Branch Tags/Dimensions",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Branch Length/Metrics",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      jsonConfig: {
        type: 'void',
        'x-component': 'div',
        properties: {
          template: {
            required: true,
            title: '{{t("JSON config",{ns:"charts"})}}',
            type: 'string',
            default: JSON5.stringify(chartConfig, null, 2),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: { minRows: 8, maxRows: 16 },
            },
            'x-validator': validateJSON,
          },
          references: {
            type: 'string',
            'x-decorator': 'div',
            'x-content': <span>{lang('Json config references: ')}<a
              href={'https://g2plot.antv.antgroup.com/api/plots/radar'}
              target='_blank'>{lang('Radar | G2Plot')}</a></span>,
          },
        },
      },
    },
  },
};
