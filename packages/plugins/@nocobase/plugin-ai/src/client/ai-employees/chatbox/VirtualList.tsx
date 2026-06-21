/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import RcVirtualList from 'rc-virtual-list';
import type { ListRef } from 'rc-virtual-list';

export interface VirtualListRef {
  scrollTo: (arg: number | { index?: number; key?: React.Key; align?: 'top' | 'bottom' | 'auto'; offset?: number }) => void;
}

export interface VirtualListProps<T> {
  data: T[];
  itemKey: string | ((item: T) => React.Key);
  itemHeight?: number;
  children: (item: T, index: number, props: { style?: React.CSSProperties }) => React.ReactNode;
}

function VirtualListInner<T>(props: VirtualListProps<T>, ref: React.Ref<VirtualListRef>) {
  const { data, itemKey, itemHeight = 48, children } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<ListRef>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    setHeight(el.clientHeight);

    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    scrollTo: (arg) => {
      listRef.current?.scrollTo(arg as any);
    },
  }));

  return (
    <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }}>
      <RcVirtualList
        ref={listRef}
        data={data}
        itemKey={itemKey}
        height={height}
        itemHeight={itemHeight}
        fullHeight={false}
      >
        {children}
      </RcVirtualList>
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.Ref<VirtualListRef> },
) => React.ReactElement;
