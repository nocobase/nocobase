import 'echarts-wordcloud';
import { EChart } from './echart';
import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { lang } from '../locale';

export class WordCloud extends EChart {
  constructor() {
    super({
      name: 'wordCloud',
      title: lang('Word cloud'),
      series: { type: 'wordCloud' },
    });
    this.config = [
      'size',
      {
        configType: 'select',
        name: 'shape',
        title: lang('Shape'),
        defaultValue: 'square',
        options: [
          {
            label: lang('Square'),
            value: 'square',
          },
          {
            label: lang('Circle'),
            value: 'circle',
          },
          {
            label: lang('Cardioid'),
            value: 'cardioid',
          },
          {
            label: lang('Triangle'),
            value: 'triangle',
          },
          {
            label: lang('Triangle forward'),
            value: 'triangle-forward',
          },
          {
            label: lang('Pentagon'),
            value: 'pentagon',
          },
          {
            label: lang('Star'),
            value: 'star',
          },
        ],
      },
    ];
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
    const { xField, yField, shape = 'square' } = general;
    const options = {
      tooltip: {},
      series: {
        shape,
        keepAspect: false,
        data: data
          .filter((row: any) => row[yField])
          .map((row: any) => ({
            name: row[xField],
            value: row[yField],
          })),
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          // Color can be a callback function or a color string
          color: function () {
            // Random color
            return (
              'rgb(' +
              [Math.round(Math.random() * 160), Math.round(Math.random() * 160), Math.round(Math.random() * 160)].join(
                ',',
              ) +
              ')'
            );
          },
        },
        emphasis: {
          focus: 'self',
        },
        // drawOutOfBound: true,
        shrinkToFit: true,
        ...this.series,
      },
      ...this.getBasicOptions({ general }),
    };
    return options;
  }
}
