import React, { useContext, useEffect, useRef } from 'react';
import { ChartRendererContext } from '../../renderer';

export const getAntChart = (Component: React.FC<any>) => (props: any) => {
  const { service } = useContext(ChartRendererContext);
  const chartRef = useRef(null);
  const [height, setHeight] = React.useState<number>(0);
  useEffect(() => {
    const el = chartRef.current;
    if (!el || service.loading === true) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setHeight(entry.contentRect.height);
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [service.loading]);
  return (
    <div ref={chartRef} style={height ? { height: `${height}px` } : {}}>
      <Component {...props} {...(height ? { height } : {})} />
    </div>
  );
};
