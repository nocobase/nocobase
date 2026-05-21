/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

export const useListHeight = ({
  heightMode,
  containerRef,
  actionsRef,
  listRef,
  deps = [],
}: {
  heightMode?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  actionsRef: React.RefObject<HTMLDivElement>;
  listRef: React.RefObject<HTMLDivElement>;
  deps?: React.DependencyList;
}) => {
  const [listHeight, setListHeight] = useState<number>();
  const calcListHeight = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setListHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    if (!containerHeight) return;
    const actionsHeight = getOuterHeight(actionsRef.current);
    const paginationEl = listRef.current?.querySelector('.ant-list-pagination') as HTMLElement | null;
    const paginationHeight = getOuterHeight(paginationEl);
    const nextHeight = Math.max(0, Math.floor(containerHeight - actionsHeight - paginationHeight));
    setListHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, containerRef, actionsRef, listRef]);

  useLayoutEffect(() => {
    calcListHeight();
  }, [calcListHeight, ...deps]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const container = containerRef.current;
    const actions = actionsRef.current;
    const paginationEl = listRef.current?.querySelector('.ant-list-pagination') as HTMLElement | null;
    const observer = new ResizeObserver(() => calcListHeight());
    observer.observe(container);
    if (actions) observer.observe(actions);
    if (paginationEl) observer.observe(paginationEl);
    return () => observer.disconnect();
  }, [calcListHeight, containerRef, actionsRef, listRef, ...deps]);

  return listHeight;
};
