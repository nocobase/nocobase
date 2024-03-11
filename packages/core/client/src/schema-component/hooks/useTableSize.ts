import { useEventListener } from 'ahooks';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function findParentBySelector(element: HTMLElement, selector: string) {
  if (!element || !selector) return null;
  // 当前元素的父元素
  let parent = element.parentElement;

  // 递归终止条件：找到匹配的父元素或者没有父元素（即已经到达了根元素）
  while (parent !== null) {
    // 检查当前父元素是否匹配给定的选择器
    if (parent.matches(selector)) {
      return parent; // 返回匹配的父元素
    }
    // 向上移动到下一个父元素
    parent = parent.parentElement;
  }

  // 如果没有找到匹配的元素，则返回 null
  return null;
}

export const useTableSize = (columns: { width?: any }[], enable?: boolean) => {
  const [tableHeight, setTableHeight] = useState(0);
  const [tableWidth, setTableWidth] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLElement>(null);

  const columnsWidth = useMemo(() => {
    if (!enable) return 0;
    return columns.reduce((sum, column) => {
      return sum + Number(column.width || 200);
    }, 0);
  }, [columns]);

  const calcTableSize = useCallback(
    debounce(() => {
      if (!enable) return;

      if (!elementRef.current) return;
      const clientRect = elementRef.current.parentElement.getBoundingClientRect();
      const headerHeight = elementRef.current.querySelector('.ant-table-header')?.getBoundingClientRect().height || 0;
      const tableContentRect = elementRef.current.querySelector('.ant-table')?.getBoundingClientRect();
      if (!tableContentRect) return;
      const paginationRect = elementRef.current.querySelector('.ant-table-pagination')?.getBoundingClientRect();
      const paginationHeight = paginationRect
        ? paginationRect.y - tableContentRect.height - tableContentRect.y + paginationRect.height
        : 0;

      // 这里代码属于无奈之举，初始化的时候，clientWidth 和第二次不知道为什么相差了 4px 导致了多重复渲染一次，所以这里做了一个判断
      setTableWidth((pre) => (pre > 0 && pre - clientRect.width <= 5 ? pre : clientRect.width + 4));
      const gridOffsetTop = gridRef.current?.getBoundingClientRect().top || 0;
      const actionBarHeight = 32 + 24;
      const cardPadding = 24 * 2;
      const cardMargin = 24 * 2;
      const addBlockHeight = 32;
      setTableHeight(
        document.documentElement.clientHeight -
          gridOffsetTop -
          headerHeight -
          paginationHeight -
          actionBarHeight -
          cardPadding -
          cardMargin -
          addBlockHeight,
      );
    }, 100),
    [enable],
  );

  const tableSizeRefCallback: React.RefCallback<HTMLDivElement> = useCallback(
    (ref) => {
      elementRef.current = ref && ref.children ? (ref.children[0] as HTMLDivElement) : null;
      gridRef.current =
        findParentBySelector(elementRef.current, '.nb-grid') || document.querySelector('.nb-page-content');
      calcTableSize();
    },
    [calcTableSize, enable],
  );

  useEventListener('resize', calcTableSize);

  if (!enable) {
    return { tableHeight: undefined, tableWidth: 'max-content' };
  }

  return {
    tableHeight: tableHeight < 400 ? 400 : tableHeight,
    tableWidth: tableWidth < columnsWidth ? columnsWidth : tableWidth,
    tableSizeRefCallback,
  };
};
