import React, { useEffect } from 'react';
import ReactEChartsComponent, { EChartsInstance, EChartsReactProps } from 'echarts-for-react';

export const ReactECharts = (props: EChartsReactProps['option']) => {
  const echartRef = React.useRef<EChartsInstance>();
  useEffect(() => {
    echartRef.current?.resize();
  });
  return <ReactEChartsComponent option={props} ref={(e) => (echartRef.current = e)} />;
};
