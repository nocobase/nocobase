/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useMemo, useRef } from 'react';

/**
 * 通过鼠标的位置计算出最佳的 dropdown 的高度，以尽量避免出现滚动条
 * @param deps 类似于 useEffect 的第二个参数，如果不传则默认为 []
 */
export const useNiceDropdownMaxHeight = (deps: any[] = []) => {
  const heightRef = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const { clientY } = e;
      const h = Math.max(clientY, window.innerHeight - clientY);
      heightRef.current = h;
    };

    window.addEventListener('mousemove', handler);

    return () => {
      window.removeEventListener('mousemove', handler);
    };
  }, []);

  return useMemo(() => heightRef.current - 40, deps);
};
