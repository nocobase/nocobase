/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEventListener } from 'ahooks';
import { debounce } from 'lodash';
import { useCallback, useRef, useState } from 'react';
export const useTableSize = (enable?: boolean) => {
  const [height, setTableHeight] = useState(0);
  const [width, setTableWidth] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const calcTableSize = useCallback(
    debounce(() => {
      if (!elementRef.current || !enable) return;
      const clientRect = elementRef.current.getBoundingClientRect();
      const tableHeight = Math.ceil(clientRect?.height || 0);
      const headerHeight = elementRef.current.querySelector('.ant-table-header')?.getBoundingClientRect().height || 0;
      const tableContentRect = elementRef.current.querySelector('.ant-table')?.getBoundingClientRect();
      if (!tableContentRect) return;
      const paginationRect = elementRef.current.querySelector('.ant-table-pagination')?.getBoundingClientRect();
      const paginationHeight = paginationRect
        ? paginationRect.y - tableContentRect.height - tableContentRect.y + paginationRect.height
        : 0;
      setTableWidth(clientRect.width);
      setTableHeight(tableHeight - headerHeight - paginationHeight);
    }, 100),
    [enable],
  );

  const tableSizeRefCallback: React.RefCallback<HTMLDivElement> = useCallback(
    (ref) => {
      elementRef.current = ref && ref.children ? (ref.children[0] as HTMLDivElement) : null;
      calcTableSize();
    },
    [calcTableSize],
  );

  useEventListener('resize', calcTableSize);

  return { height, width, tableSizeRefCallback };
};
