/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Popover as AntdPopover, type PopoverProps } from 'antd';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { getZIndex, useZIndexContext, zIndexContext } from './zIndexContext';

export const ICON_POPUP_Z_INDEX = 2000;

function parseZIndex(value?: string | null) {
  if (!value || value === 'auto') {
    return;
  }

  const zIndex = Number(value);
  return Number.isFinite(zIndex) ? zIndex : undefined;
}

function getElementZIndex(element: HTMLElement) {
  return parseZIndex(window.getComputedStyle(element).zIndex) ?? parseZIndex(element.style.zIndex);
}

function getContainingPopupZIndex(element: HTMLElement | null) {
  if (!element || typeof window === 'undefined') {
    return 0;
  }

  let current: HTMLElement | null = element;
  let maxZIndex = 0;

  while (current && current !== document.documentElement) {
    const zIndex = getElementZIndex(current);
    if (typeof zIndex === 'number' && zIndex > maxZIndex) {
      maxZIndex = zIndex;
    }
    current = current.parentElement;
  }

  return maxZIndex;
}

export const StablePopover = (props: PopoverProps) => {
  const parentZIndex = useZIndexContext();
  const [containingPopupZIndex, setContainingPopupZIndex] = useState(parentZIndex);
  const target = useRef<EventTarget | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const zIndex = getZIndex('drawer', Math.max(parentZIndex, containingPopupZIndex), 1);

  useLayoutEffect(() => {
    const nextZIndex = Math.max(parentZIndex, getContainingPopupZIndex(triggerRef.current));
    setContainingPopupZIndex((previousZIndex) => (previousZIndex === nextZIndex ? previousZIndex : nextZIndex));
  }, [parentZIndex]);

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
    <div ref={triggerRef} className="popover-with-stop-propagation" onClick={avoidClose}>
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
