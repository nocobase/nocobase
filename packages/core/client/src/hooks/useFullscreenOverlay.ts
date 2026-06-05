/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme } from 'antd';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getZIndex, useZIndexContext } from '../schema-component/antd/action/zIndexContext';

type UseFullscreenOverlayResult = {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  placeholderRef: React.RefCallback<HTMLDivElement>;
  placeholderStyle: React.CSSProperties;
  container: HTMLElement | null;
};

let bodyLockCount = 0;
let bodyOverflowPrev = '';

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  if (bodyLockCount === 0) {
    bodyOverflowPrev = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = bodyOverflowPrev;
  }
}

export function useFullscreenOverlay(): UseFullscreenOverlayResult {
  const parentZIndex = useZIndexContext();
  const { token } = theme.useToken();

  const [placeholderEl, setPlaceholderEl] = useState<HTMLDivElement | null>(null);
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [placeholderStyle, setPlaceholderStyle] = useState<React.CSSProperties>({});

  const zIndex = useMemo(() => getZIndex('modal', parentZIndex + 1000, 0), [parentZIndex]);

  const placeholderRef = useCallback((el: HTMLDivElement | null) => {
    setPlaceholderEl(el);
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    unlockBodyScroll();

    setOverlayEl((prev) => {
      try {
        prev?.remove();
      } catch (_) {
        void 0;
      }
      return null;
    });
  }, []);

  const enterFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (isFullscreen) return;

    const rect = placeholderEl?.getBoundingClientRect();
    const measuredHeight =
      rect?.height || ((placeholderEl?.firstElementChild as HTMLElement | null)?.getBoundingClientRect?.().height ?? 0);
    if (measuredHeight) {
      setPlaceholderStyle({ height: measuredHeight });
    }

    const el = document.createElement('div');
    el.setAttribute('data-nocobase-fullscreen-overlay', 'true');
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = String(zIndex);
    el.style.background = token.colorBgContainer;
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.overflow = 'hidden';

    document.body.appendChild(el);
    setOverlayEl(el);
    setIsFullscreen(true);
    lockBodyScroll();
  }, [isFullscreen, placeholderEl, token.colorBgContainer, zIndex]);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitFullscreen, isFullscreen]);

  useEffect(() => {
    return () => {
      if (isFullscreen) {
        exitFullscreen();
      }
    };
  }, [exitFullscreen, isFullscreen]);

  const container = isFullscreen ? overlayEl : placeholderEl;

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    placeholderRef,
    placeholderStyle,
    container,
  };
}
