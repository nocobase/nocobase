/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const getOuterHeight = (element?: HTMLElement | null) => {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return rect.height + marginTop + marginBottom;
};

export const useDetailsGridHeight = ({
  heightMode,
  containerRef,
  actionsRef,
  paginationRef,
  deps = [],
}: {
  heightMode?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  actionsRef: React.RefObject<HTMLDivElement>;
  paginationRef: React.RefObject<HTMLDivElement>;
  deps?: React.DependencyList;
}) => {
  const [gridHeight, setGridHeight] = useState<number>();
  const calcGridHeight = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setGridHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    const containerHeight = container.getBoundingClientRect().height;
    if (!containerHeight) return;
    const actionsHeight = getOuterHeight(actionsRef.current);
    const paginationHeight = getOuterHeight(paginationRef.current);
    const nextHeight = Math.max(0, Math.floor(containerHeight - actionsHeight - paginationHeight));
    setGridHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [heightMode, containerRef, actionsRef, paginationRef]);

  useLayoutEffect(() => {
    calcGridHeight();
  }, [calcGridHeight, ...deps]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const container = containerRef.current;
    const actions = actionsRef.current;
    const pagination = paginationRef.current;
    const observer = new ResizeObserver(() => calcGridHeight());
    observer.observe(container);
    if (actions) observer.observe(actions);
    if (pagination) observer.observe(pagination);
    return () => observer.disconnect();
  }, [calcGridHeight, containerRef, actionsRef, paginationRef, ...deps]);

  return gridHeight;
};
