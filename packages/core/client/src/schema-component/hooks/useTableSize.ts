import { useEventListener } from 'ahooks';
import { useCallback, useRef, useState } from 'react';
export const useTableSize = () => {
  const [height, setTableHeight] = useState(0);
  const [width, setTableWidth] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  const calcTableSize = useCallback(() => {
    if (!elementRef.current) return;
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
  }, []);

  const tableSizeRefCallback: React.RefCallback<HTMLDivElement> = (ref) => {
    elementRef.current = ref && ref.children ? (ref.children[0] as HTMLDivElement) : null;
    calcTableSize();
  };

  useEventListener('resize', calcTableSize);

  return { height, width, tableSizeRefCallback };
};
