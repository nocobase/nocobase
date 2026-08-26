/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover as AntdPopover, type PopoverProps } from 'antd';
import React, { useCallback, useRef } from 'react';

const zIndexContext = React.createContext(100);

const useZIndexContext = () => {
  return React.useContext(zIndexContext);
};

const getZIndex = (type: 'page' | 'drawer' | 'modal', basicZIndex: number, level: number) => {
  let result = basicZIndex;

  if (type === 'page' && !window.location.pathname.includes('/embed/')) {
    result = basicZIndex + level;
    return result > 200 ? result - 200 : result;
  }

  result = basicZIndex + level;
  return result < 200 ? result + 200 : result;
};

export const StablePopover = (props: PopoverProps) => {
  const parentZIndex = useZIndexContext();
  const zIndex = getZIndex('drawer', parentZIndex, 1);
  const target = useRef(null);

  const avoidClose = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    target.current = event.target;
  }, []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      setTimeout(() => {
        if (!open && target.current !== null && !isTargetInPopover(target.current)) {
          target.current = null;
          return;
        }
        props.onOpenChange?.(open);
      });
    },
    [props],
  );

  return (
    <div className="popover-with-stop-propagation" onClick={avoidClose}>
      <zIndexContext.Provider value={zIndex}>
        <AntdPopover {...props} zIndex={zIndex} onOpenChange={onOpenChange} />
      </zIndexContext.Provider>
    </div>
  );
};

function isTargetInPopover(target: any) {
  if (!target) {
    return false;
  }

  while (target) {
    if (target.classList?.contains('popover-with-stop-propagation')) {
      return true;
    }
    target = target.parentNode;
  }

  return false;
}
