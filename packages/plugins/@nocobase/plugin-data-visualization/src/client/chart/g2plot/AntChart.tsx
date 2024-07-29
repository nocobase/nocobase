/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useRef } from 'react';
import { ChartRendererContext } from '../../renderer';

export const getAntChart = (Component: React.FC<any>) => (props: any) => {
  const { size = {} } = props;
  let { height: fixedHeight } = props;
  if (!fixedHeight && size.type === 'fixed') {
    fixedHeight = size.fixed;
  }
  const { service } = useContext(ChartRendererContext);
  const chartRef = useRef(null);
  const [height, setHeight] = React.useState<number>(0);
  useEffect(() => {
    const el = chartRef.current;
    if (!el || service.loading === true || fixedHeight) {
      return;
    }
    let ratio = 0;
    if (size.type === 'ratio' && size.ratio?.width && size.ratio?.height) {
      ratio = size.ratio.height / size.ratio.width;
    }
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (ratio) {
          setHeight(entry.contentRect.width * ratio);
          return;
        }
        setHeight(entry.contentRect.height);
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [service.loading, fixedHeight, size.type, size.ratio?.width, size.ratio?.height]);
  const chartHeight = fixedHeight || height;

  return (
    <div ref={chartRef} style={chartHeight ? { height: `${chartHeight}px` } : {}}>
      <Component {...props} {...(chartHeight ? { height: chartHeight } : {})} />
    </div>
  );
};
