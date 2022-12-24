import { gridRowColWrap } from '../utils';
import * as chartConfig from './chart-config';

// 页面里添加区块
export const BlockInitializers = {
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  wrap: gridRowColWrap,
  items: [
    {
      key: 'dataBlocks',
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      children: [
        {
          key: 'table',
          type: 'item',
          title: '{{t("Table")}}',
          component: 'TableBlockInitializer',
        },
        {
          key: 'form',
          type: 'item',
          title: '{{t("Form")}}',
          component: 'FormBlockInitializer',
        },
        {
          key: 'details',
          type: 'item',
          title: '{{t("Details")}}',
          component: 'DetailsBlockInitializer',
        },
        {
          key: 'calendar',
          type: 'item',
          title: '{{t("Calendar")}}',
          component: 'CalendarBlockInitializer',
        },
        {
          key: 'kanban',
          type: 'item',
          title: '{{t("Kanban")}}',
          component: 'KanbanBlockInitializer',
        },
      ],
    },
    {
      key: 'g2plot',
      type: 'itemGroup',
      title: '{{t("Chart blocks")}}',
      children: [
        {
          key: 'column',
          type: 'item',
          title: '{{t("Column chart")}}',
          component: 'G2PlotInitializer',
          icon: 'BarChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              plot: 'Column',
              config: chartConfig.column,
            },
          },
        },
        {
          key: 'bar',
          type: 'item',
          title: '{{t("Bar chart")}}',
          component: 'G2PlotInitializer',
          icon: 'BarChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              plot: 'Bar',
              config: chartConfig.bar,
            },
          },
        },
        {
          key: 'line',
          type: 'item',
          title: '{{t("Line chart")}}',
          component: 'G2PlotInitializer',
          icon: 'LineChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              plot: 'Line',
              config: chartConfig.line,
            },
          },
        },
        {
          key: 'pie',
          type: 'item',
          title: '{{t("Pie chart")}}',
          component: 'G2PlotInitializer',
          icon: 'PieChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              plot: 'Pie',
              config: chartConfig.pie,
            },
          },
        },
        {
          key: 'area',
          type: 'item',
          title: '{{t("Area chart")}}',
          component: 'G2PlotInitializer',
          icon: 'AreaChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              plot: 'Area',
              config: chartConfig.area,
            },
          },
        },
        {
          key: 'other',
          type: 'item',
          title: '{{t("Other chart")}}',
          component: 'G2PlotInitializer',
          icon: 'AreaChartOutlined',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot',
            'x-component-props': {
              // plot: 'Area',
              // config: {},
            },
          },
        },
      ],
    },
    {
      key: 'media',
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      children: [
        {
          key: 'markdown',
          type: 'item',
          title: '{{t("Markdown")}}',
          component: 'MarkdownBlockInitializer',
        },
        {
          key: 'auditLogs',
          type: 'item',
          title: '{{t("Audit logs")}}',
          component: 'AuditLogsBlockInitializer',
        },
      ],
    },
  ],
};
