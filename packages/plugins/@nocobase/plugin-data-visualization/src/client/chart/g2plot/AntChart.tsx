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
  const { service } = useContext(ChartRendererContext);
  const chartRef = useRef(null);
  const [height, setHeight] = React.useState<number>(0);
  useEffect(() => {
    const el = chartRef.current;
    if (!el || service.loading === true || props.height) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setHeight(entry.contentRect.height);
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [service.loading, props.height]);
  return (
    <div ref={chartRef} style={height ? { height: `${props.height || height}px` } : {}}>
      <Component {...props} {...(height ? { height: props.height || height } : {})} />
    </div>
  );
};
