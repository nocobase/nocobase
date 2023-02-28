import JSON5 from 'json5';
import React from 'react';
import { i18n } from '@nocobase/client';

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
  message: '{{t("Invalid JSON format")}}',
};

const chartConfig = {
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
  description: '1 ~ 2 个「无序名词」字段，1 个「数值」字段',
  type: 'Radar',
  title: 'Radar',
  iconId: 'icon-other',
  group: 1,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'object',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Branch Tags/Dimensions")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Branch Length/Metrics")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      jsonConfig: {
        type: 'void',
        'x-component': 'div',
        properties: {
          jsonConfig: {
            required: true,
            title: '{{t("JSON config")}}',
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
            'x-content': <span>{i18n.t('Json config references: ')}<a
              href={'https://g2plot.antv.antgroup.com/api/plots/radar'}
              target='_blank'>{i18n.t('Radar | G2Plot')}</a></span>,
          },
        },
      },
    },
  },
};
