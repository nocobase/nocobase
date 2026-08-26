/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useRef, useState } from 'react';

export const useSetChartSize = (
  size: {
    type?: 'fixed' | 'ratio';
    ratio?: {
      width: number;
      height: number;
    };
    fixed?: number;
  } = {},
  fixedHeight?: number,
) => {
  const [height, setHeight] = useState<number>(fixedHeight || size.fixed || 0);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el || fixedHeight || size.type === 'fixed') {
      return;
    }

    const ratio =
      size.type === 'ratio' && size.ratio?.width && size.ratio?.height ? size.ratio.height / size.ratio.width : 0;
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setHeight(ratio ? entry.contentRect.width * ratio : Math.max(entry.contentRect.height, 400));
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedHeight, size.ratio?.height, size.ratio?.width, size.type]);

  return {
    chartRef,
    chartHeight: fixedHeight || height || size.fixed || 400,
  };
};
