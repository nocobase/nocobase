import { gridRowColWrap } from '../utils';

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
      key: 'media',
      type: 'itemGroup',
      title: '{{t("Media")}}',
      children: [
        {
          key: 'markdown',
          type: 'item',
          title: '{{t("Markdown")}}',
          component: 'MarkdownBlockInitializer',
        },
      ],
    },
    {
      key: 'g2plot',
      type: 'itemGroup',
      title: '{{t("Charts")}}',
      children: [
        {
          key: 'column',
          type: 'item',
          title: '{{t("Column")}}',
          component: 'G2PlotInitializer',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot.Column',
            'x-component-props': {
              config: {
                data: [
                  {
                    type: '家具家电',
                    sales: 38,
                  },
                  {
                    type: '粮油副食',
                    sales: 52,
                  },
                  {
                    type: '生鲜水果',
                    sales: 61,
                  },
                  {
                    type: '美容洗护',
                    sales: 145,
                  },
                  {
                    type: '母婴用品',
                    sales: 48,
                  },
                  {
                    type: '进口食品',
                    sales: 38,
                  },
                  {
                    type: '食品饮料',
                    sales: 38,
                  },
                  {
                    type: '家庭清洁',
                    sales: 38,
                  },
                ],
                xField: 'type',
                yField: 'sales',
                label: {
                  // 可手动配置 label 数据标签位置
                  position: 'middle', // 'top', 'bottom', 'middle',
                  // 配置样式
                  style: {
                    fill: '#FFFFFF',
                    opacity: 0.6,
                  },
                },
                xAxis: {
                  label: {
                    autoHide: true,
                    autoRotate: false,
                  },
                },
                meta: {
                  type: {
                    alias: '类别',
                  },
                  sales: {
                    alias: '销售额',
                  },
                },
              },
            },
          },
        },
        {
          key: 'bar',
          type: 'item',
          title: '{{t("Bar")}}',
          component: 'G2PlotInitializer',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot.Bar',
            'x-component-props': {
              config: {
                data: [
                  { year: '1951 年', value: 38 },
                  { year: '1952 年', value: 52 },
                  { year: '1956 年', value: 61 },
                  { year: '1957 年', value: 145 },
                  { year: '1958 年', value: 48 },
                ],
                xField: 'value',
                yField: 'year',
                seriesField: 'year',
                legend: {
                  position: 'top-left',
                },
              },
            },
          },
        },
        {
          key: 'line',
          type: 'item',
          title: '{{t("Line")}}',
          component: 'G2PlotInitializer',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot.Line',
            'x-component-props': {
              config: {
                data: [
                  {
                    Date: '2010-01',
                    scales: 1998,
                  },
                  {
                    Date: '2010-02',
                    scales: 1850,
                  },
                  {
                    Date: '2010-03',
                    scales: 1720,
                  },
                  {
                    Date: '2010-04',
                    scales: 1818,
                  },
                  {
                    Date: '2010-05',
                    scales: 1920,
                  },
                  {
                    Date: '2010-06',
                    scales: 1802,
                  },
                  {
                    Date: '2010-07',
                    scales: 1945,
                  },
                  {
                    Date: '2010-08',
                    scales: 1856,
                  },
                  {
                    Date: '2010-09',
                    scales: 2107,
                  },
                ],
                padding: 'auto',
                xField: 'Date',
                yField: 'scales',
                xAxis: {
                  // type: 'timeCat',
                  tickCount: 5,
                },
              },
            },
          },
        },
        {
          key: 'pie',
          type: 'item',
          title: '{{t("Pie")}}',
          component: 'G2PlotInitializer',
          schema: {
            type: 'void',
            'x-designer': 'G2Plot.Designer',
            'x-decorator': 'CardItem',
            'x-component': 'G2Plot.Pie',
            'x-component-props': {
              config: {
                appendPadding: 10,
                data: [
                  { type: '分类一', value: 27 },
                  { type: '分类二', value: 25 },
                  { type: '分类三', value: 18 },
                  { type: '分类四', value: 15 },
                  { type: '分类五', value: 10 },
                  { type: '其他', value: 5 },
                ],
                angleField: 'value',
                colorField: 'type',
                radius: 0.9,
                label: {
                  type: 'inner',
                  offset: '-30%',
                  content: '{{ ({ percent }) => `${(percent * 100).toFixed(0)}%` }}',
                  style: {
                    fontSize: 14,
                    textAlign: 'center',
                  },
                },
                interactions: [{ type: 'element-active' }],
              },
            },
          },
        },
      ],
    },
  ],
};
