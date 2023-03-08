import JSON5 from 'json5';
import { lang } from '../locale';

const aggregationEnum = [
  {
    label: '{{t("SUM",{ns:"charts"})}}',
    value: 'SUM',
  },
  {
    label: '{{t("AVG",{ns:"charts"})}}',
    value: 'AVG',
  },
  {
    label: '{{t("COUNT",{ns:"charts"})}}',
    value: 'COUNT',
  },
  {
    label: '{{t("MAX",{ns:"charts"})}}',
    value: 'MAX',
  },
  {
    label: '{{t("MIN",{ns:"charts"})}}',
    value: 'MIN',
  },
  {
    label: '{{t("NONE",{ns:"charts"})}}',
    value: 'NONE',
  },
];
export const indicatorKanbanTemplate = {
  description: '{{t("1 「Value」 field",{ns:"charts"})}}',
  title: lang('Indicator Kanban'),
  type: 'IndicatorKanban',
  iconId: 'icon-other',
  group: 1,
  renderComponent: 'IndicatorKanban',
  configurableProperties: {
    type: 'void',
    properties: {
      title: {
        type: 'string',
        title: '{{t("Indicator Kanban title",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Kanban indicators / Metrics",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      aggregation: {
        required: true,
        type: 'string',
        title: '{{t("Aggregation function",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: aggregationEnum,
      },
    },
  },
};
