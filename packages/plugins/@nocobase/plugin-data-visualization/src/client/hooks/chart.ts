/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext, useEffect, useRef, useState } from 'react';
import { ChartRendererContext } from '../renderer';

export const useSetChartSize = (
  size: {
    type: 'fixed' | 'ratio';
    ratio?: {
      width: number;
      height: number;
    };
    fixed?: number;
  },
  fixedHeight?: number,
) => {
  const [height, setHeight] = useState<number>(0);
  const chartRef = useRef(null);
  const { service } = useContext(ChartRendererContext);
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
        setHeight(entry.contentRect.height > 400 ? entry.contentRect.height : 400);
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [service.loading, fixedHeight, size.type, size.ratio?.width, size.ratio?.height]);
  const chartHeight = fixedHeight || height;

  return { chartRef, chartHeight };
};
