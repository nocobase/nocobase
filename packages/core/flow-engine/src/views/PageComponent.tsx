/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const PageComponent = forwardRef((props: any, ref) => {
  const { visible = true, afterClose, onClose, children, ...rest } = props;
  const closedRef = useRef(false);

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

  if (!visible) return null;

  return <div>{children}</div>;
});

export default PageComponent;
