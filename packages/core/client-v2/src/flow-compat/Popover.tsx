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
import { getZIndex, useZIndexContext, zIndexContext } from './zIndexContext';

export const ICON_POPUP_Z_INDEX = 2000;

export const StablePopover = (props: PopoverProps) => {
  const parentZIndex = useZIndexContext();
  const zIndex = getZIndex('drawer', parentZIndex, 1);
  const target = useRef(null);

  const avoidClose = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    target.current = e.target;
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
