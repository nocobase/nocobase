import { ChartType, RenderProps } from '@nocobase/plugin-data-visualization/client';
import { EChart } from './echart';
import { lang } from '../locale';

export class DivergingBar extends EChart {
  constructor() {
    super({
      name: 'diverging-bar',
      title: lang('Diverging bar'),
    });
    this.config = [
      {
        configType: 'field',
        name: 'leftXField',
        title: lang('Left X field'),
      },
      {
        configType: 'field',
        name: 'rightXField',
        title: lang('Right X field'),
      },
      {
        configType: 'field',
        name: 'yField',
        title: lang('yField'),
      },
      'size',
      'lightTheme',
      'darkTheme',
      'showLegend',
      {
        configType: 'labelType',
        defaultValue: 0,
      },
      'colors',
      {
        configType: 'axisLabelRotate',
        name: 'yAxisLabelRotate',
        title: lang('Y-Axis label rotate'),
      },
      'padding',
      {
        configType: 'splitLine',
        defaultValue: 'x',
      },
    ];
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yFields } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        yField: xField?.value,
        leftXField: yFields[0]?.value,
        rightXField: yFields[1]?.value,
      },
    };
  };

  getProps({ data, general, advanced, fieldProps }: RenderProps) {
    const {
      yField,
      leftXField,
      rightXField,
      splitLine,
      padding,
      showLegend,
      labelType,
      colors,
      yAxisLabelRotate = 0,
    } = general;
    const leftXLabel = fieldProps[leftXField]?.label;
    const rightXLabel = fieldProps[rightXField]?.label;
    const xSplitLine = {
      show: splitLine?.type === 'x' || splitLine?.type === 'xy',
      lineStyle: {
        type: splitLine?.style,
      },
    };
    const ySplitLine = {
      show: splitLine?.type === 'y' || splitLine?.type === 'xy',
      lineStyle: {
        type: splitLine?.style,
      },
    };

    const { left, right, bottom, top } = padding || {};
    const props: any = {
      legend: {
        show: showLegend,
        data: [leftXLabel, rightXLabel],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      xAxis: [
        {
          name: leftXLabel,
          nameLocation: 'middle',
          nameGap: 30,
          type: 'value',
          position: 'bottom',
          inverse: true,
          gridIndex: 0,
          splitLine: xSplitLine,
        },
        {
          name: rightXLabel,
          nameLocation: 'middle',
          nameGap: 30,
          type: 'value',
          position: 'bottom',
          gridIndex: 1,
          splitLine: xSplitLine,
        },
      ],
      yAxis: [
        {
          type: 'category',
          gridIndex: 0,
          axisTick: {
            show: false,
          },
          data: data.map((row: any) => row[yField]),
          splitLine: ySplitLine,
          axisLabel: {
            rotate: yAxisLabelRotate,
          },
        },
        {
          type: 'category',
          gridIndex: 1,
          axisTick: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          data: data.map((row: any) => row[yField]),
          splitLine: ySplitLine,
        },
      ],
      series: [
        {
          name: fieldProps[leftXField]?.label || leftXField,
          type: 'bar',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: data.map((row: any) => row[leftXField]),
          label: {
            ...this.getLabelOptions({ labelType, series: leftXField }),
          },
        },
        {
          name: fieldProps[rightXField]?.label || rightXLabel,
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.map((row: any) => row[rightXField]),
          label: {
            ...this.getLabelOptions({ labelType, series: rightXField }),
          },
        },
      ],
      ...this.getBasicOptions({ general }),
      grid: [
        {
          top: top || '60',
          left: left || '5%',
          right: '50%',
          bottom: bottom || '10%',
        },
        {
          top: top || '60',
          left: '50%',
          right: right || '5%',
          bottom: bottom || '10%',
        },
      ],
    };
    const color = colors?.filter((color: string) => color) || [];
    if (color.length) {
      props.color = color;
    }
    return props;
  }
}
