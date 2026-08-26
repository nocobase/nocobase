/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export const useCalendarHeight = ({
  height,
  heightMode,
  containerRef,
  actionBarRef,
}: {
  height?: number;
  heightMode?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  actionBarRef: React.RefObject<HTMLDivElement>;
}) => {
  const [calendarHeight, setCalendarHeight] = useState<number>();

  const calcCalendarHeight = useCallback(() => {
    if (heightMode !== 'specifyValue' && heightMode !== 'fullHeight') {
      setCalendarHeight((prev) => (prev === undefined ? prev : undefined));
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const containerHeight = container.getBoundingClientRect().height;
    if (!containerHeight) return;

    const actionBarHeight = actionBarRef.current?.getBoundingClientRect().height || 0;
    const nextHeight = Math.max(0, Math.floor(containerHeight - actionBarHeight));
    setCalendarHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, [actionBarRef, containerRef, heightMode]);

  useLayoutEffect(() => {
    if (heightMode === 'specifyValue' && typeof height === 'number') {
      setCalendarHeight(height);
      return;
    }
    calcCalendarHeight();
  }, [calcCalendarHeight, height, heightMode]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => calcCalendarHeight());
    observer.observe(containerRef.current);
    if (actionBarRef.current) observer.observe(actionBarRef.current);
    return () => observer.disconnect();
  }, [actionBarRef, calcCalendarHeight, containerRef]);

  if (heightMode === 'specifyValue') {
    return height;
  }

  return calendarHeight;
};
