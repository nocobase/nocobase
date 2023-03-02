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
  _xType: 'Scatter',
  appendPadding: 10,
  xField: '{{metric}}',
  yField: '{{dimension}}',
  colorField: '{{category}}',
  shape: 'circle',
  size: 4,
  yAxis: {
    nice: true,
    line: {
      style: {
        stroke: '#aaa',
      },
    },
  },
  xAxis: {
    min: -100,
    grid: {
      line: {
        style: {
          stroke: '#eee',
        },
      },
    },
    line: {
      style: {
        stroke: '#aaa',
      },
    },
  },
};
export const scatterTemplate = {
  description: '1 个「数值」字段，0 ~ 1 个「无序名词」字段',
  type: 'Scatter',
  title: 'Scatter',
  iconId: 'icon-scatter',
  group: 2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Category axis / Dimension",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Value axis / Metrics",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      category: {
        type: 'string',
        title: '{{t("Color legend / Dimensional",{ns:"charts"})}}',
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
              href={'https://g2plot.antv.antgroup.com/api/plots/scatter'}
              target='_blank'>{lang('Scatter | G2Plot')}</a></span>,
          },
        },
      },
    },
  },
};
