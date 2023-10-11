import { RenderProps } from '@nocobase/plugin-data-visualization/client';
import * as echarts from 'echarts';

echarts.registerTransform({
  type: 'data-visualization:transform',
  transform: function (params: any) {
    const fieldProps = params.config.fieldProps as RenderProps['fieldProps'];
    const data = params.upstream.cloneRawData();
    return {
      data: data.map((row: any) => {
        Object.entries(fieldProps).forEach(([key, props]) => {
          if (props.transformer) {
            row[key] = props.transformer(row[key]);
          }
        });
        return row;
      }),
    };
  } as any,
});

echarts.registerTransform({
  type: 'data-visualization:toSeries',
  transform: function (params: any) {
    const data = params.upstream.cloneRawData();
    const { xField, yField, seriesField } = params.config || {};
    if (!seriesField) {
      return { data };
    }
    const dataMap = data.reduce((map: any, row: any) => {
      if (!map[row[xField]]) {
        map[row[xField]] = { [row[seriesField]]: row[yField] };
        return map;
      }
      map[row[xField]][row[seriesField]] = row[yField];
      return map;
    }, {});
    const result = Object.entries(dataMap).map(([key, value]: any) => {
      return {
        [xField]: key,
        ...value,
      };
    });
    return {
      data: result,
    };
  },
});
