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
  _xType: 'Funnel',
  xField: '{{dimension}}',
  yField: '{{metric}}',
  seriesField: '{{category}}',
  legend: false,
};
export const funnelTemplate = {
  description: '1 「Unordered Noun」 field, 1 「Numeric」 field',
  type: 'Funnel',
  title: 'Funnel',
  iconId: 'icon-funnel',
  group: 1,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Sector label / Dimensional",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Funnel Layer Width/Metrics",{ns:"charts"})}}',
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
            'description':'{{jsonConfigDesc("Funnel | G2Plot","https://g2plot.antv.antgroup.com/api/plots/funnel")}}',
            'x-validator': validateJSON,
          },
        },
      },
    },
  },
};
