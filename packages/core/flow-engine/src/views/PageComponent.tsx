/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useFlowEngine } from '../provider';

export const PageComponent = forwardRef((props: any, ref) => {
  const { visible = true, afterClose, children } = props;
  const closedRef = useRef(false);
  const flowEngine = useFlowEngine();

  // 用于确定多个页面之间的层级顺序
  const index = usePageIndex();

  // 提供 destroy 和 update 能力
  useImperativeHandle(ref, () => ({
    destroy: () => {
      if (!closedRef.current) {
        closedRef.current = true;
        afterClose?.();
      }
    },
    update: (newConfig: any) => {
      // 这里可以实现 props 更新逻辑（如 setState），视你的需求
    },
  }));

  const style: React.CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      backgroundColor: flowEngine.context.themeToken.colorBgLayout,
      zIndex: index,
    }),
    [flowEngine.context.themeToken.colorBgLayout, index],
  );

  if (!visible) return null;

  return <div style={style}>{children}</div>;
});

export const PageIndexContext = React.createContext<number>(0);

const usePageIndex = () => {
  return React.useContext(PageIndexContext);
};
