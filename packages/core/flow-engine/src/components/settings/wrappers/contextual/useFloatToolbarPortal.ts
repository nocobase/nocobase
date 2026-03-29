/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, RefObject } from 'react';

const APP_CONTAINER_SELECTOR = '#nocobase-app-container';
const DRAWER_CONTENT_WRAPPER_SELECTOR = '.ant-drawer-content-wrapper';
const DRAWER_CONTENT_SELECTOR = '.ant-drawer-content';
const DRAWER_ROOT_SELECTOR = '.ant-drawer-root';
const MODAL_CONTENT_SELECTOR = '.ant-modal-content';
const MODAL_SELECTOR = '.ant-modal';
const MODAL_WRAP_SELECTOR = '.ant-modal-wrap';
const MODAL_ROOT_SELECTOR = '.ant-modal-root';

type ToolbarPortalPositioningMode = 'fixed' | 'absolute';

interface ToolbarPortalHostConfig {
  mountElement: HTMLElement;
  positioningElement: HTMLElement;
  positioningMode: ToolbarPortalPositioningMode;
}

export interface ToolbarPortalRenderSnapshot {
  mountElement: HTMLElement;
  positioningMode: ToolbarPortalPositioningMode;
}

export interface ToolbarPortalRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ToolbarPortalInset {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

interface UseFloatToolbarPortalOptions {
  active: boolean;
  containerRef: RefObject<HTMLDivElement>;
  toolbarContainerRef: RefObject<HTMLDivElement>;
  toolbarStyle?: CSSProperties;
}

interface UseFloatToolbarPortalResult {
  portalRect: ToolbarPortalRect;
  portalRenderSnapshot: ToolbarPortalRenderSnapshot | null;
  getPopupContainer: (triggerNode?: HTMLElement) => HTMLElement;
  updatePortalRect: () => void;
  schedulePortalRectUpdate: () => void;
}

const defaultPortalRect: ToolbarPortalRect = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

const getClosestElement = (hostEl: HTMLElement | null, selector: string) =>
  hostEl?.closest(selector) as HTMLElement | null;

const createAbsolutePortalHostConfig = (element: HTMLElement): ToolbarPortalHostConfig => ({
  mountElement: element,
  positioningElement: element,
  positioningMode: 'absolute',
});

const popupPortalHostResolvers: Array<(hostEl: HTMLElement | null) => HTMLElement | null> = [
  (hostEl) => getClosestElement(hostEl, DRAWER_CONTENT_WRAPPER_SELECTOR),
  (hostEl) => getClosestElement(hostEl, MODAL_CONTENT_SELECTOR),
  (hostEl) => getClosestElement(hostEl, MODAL_SELECTOR),
  (hostEl) => getClosestElement(hostEl, MODAL_WRAP_SELECTOR),
  (hostEl) => {
    const drawerContent = getClosestElement(hostEl, DRAWER_CONTENT_SELECTOR);
    return drawerContent ? getClosestElement(drawerContent, DRAWER_CONTENT_WRAPPER_SELECTOR) || drawerContent : null;
  },
  (hostEl) => getClosestElement(hostEl, DRAWER_ROOT_SELECTOR),
  (hostEl) => getClosestElement(hostEl, MODAL_ROOT_SELECTOR),
];

const getPopupPortalHostConfig = (hostEl: HTMLElement | null): ToolbarPortalHostConfig | null => {
  for (const resolveHost of popupPortalHostResolvers) {
    const popupHost = resolveHost(hostEl);
    if (popupHost) {
      return createAbsolutePortalHostConfig(popupHost);
    }
  }

  return null;
};

const getToolbarPortalHostConfig = (hostEl: HTMLElement | null): ToolbarPortalHostConfig | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const popupRootConfig = getPopupPortalHostConfig(hostEl);
  if (popupRootConfig) {
    return popupRootConfig;
  }

  const appContainer = document.querySelector(APP_CONTAINER_SELECTOR) as HTMLElement | null;
  if (appContainer) {
    return createAbsolutePortalHostConfig(appContainer);
  }

  return {
    mountElement: document.body,
    positioningElement: document.body,
    positioningMode: 'fixed',
  };
};

const parseToolbarInsetValue = (value: CSSProperties['top']) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (/^-?\d+(\.\d+)?(px)?$/.test(trimmedValue)) {
      return Number.parseFloat(trimmedValue);
    }
  }

  return 0;
};

const resolveToolbarPortalInset = (toolbarStyle?: CSSProperties): ToolbarPortalInset => {
  return {
    top: parseToolbarInsetValue(toolbarStyle?.top),
    left: parseToolbarInsetValue(toolbarStyle?.left),
    right: parseToolbarInsetValue(toolbarStyle?.right),
    bottom: parseToolbarInsetValue(toolbarStyle?.bottom),
  };
};

const getAbsolutePositioningElement = (
  toolbarEl: HTMLElement | null,
  portalHostConfig: ToolbarPortalHostConfig | null,
) => {
  if (!portalHostConfig || portalHostConfig.positioningMode !== 'absolute') {
    return portalHostConfig?.positioningElement || null;
  }

  const offsetParent = toolbarEl?.offsetParent;
  if (
    offsetParent instanceof HTMLElement &&
    offsetParent !== document.body &&
    offsetParent !== document.documentElement
  ) {
    return offsetParent;
  }

  return portalHostConfig.positioningElement;
};

const calculatePortalRect = (
  hostEl: HTMLElement | null,
  portalHostConfig: ToolbarPortalHostConfig | null,
  toolbarStyle?: CSSProperties,
  toolbarEl?: HTMLElement | null,
): ToolbarPortalRect => {
  if (!hostEl) {
    return defaultPortalRect;
  }

  const inset = resolveToolbarPortalInset(toolbarStyle);
  const hostRect = hostEl.getBoundingClientRect();

  let rect: ToolbarPortalRect;
  if (!portalHostConfig || portalHostConfig.positioningMode === 'fixed') {
    rect = {
      top: hostRect.top,
      left: hostRect.left,
      width: hostRect.width,
      height: hostRect.height,
    };
  } else {
    const positioningElement = getAbsolutePositioningElement(toolbarEl || null, portalHostConfig);
    const portalHostRect =
      positioningElement?.getBoundingClientRect() || portalHostConfig.positioningElement.getBoundingClientRect();
    const scrollTop = positioningElement?.scrollTop ?? portalHostConfig.positioningElement.scrollTop;
    const scrollLeft = positioningElement?.scrollLeft ?? portalHostConfig.positioningElement.scrollLeft;

    rect = {
      top: hostRect.top - portalHostRect.top + scrollTop,
      left: hostRect.left - portalHostRect.left + scrollLeft,
      width: hostRect.width,
      height: hostRect.height,
    };
  }

  return {
    top: rect.top + inset.top,
    left: rect.left + inset.left,
    width: Math.max(0, rect.width - inset.left - inset.right),
    height: Math.max(0, rect.height - inset.top - inset.bottom),
  };
};

export const omitToolbarPortalInsetStyle = (toolbarStyle?: CSSProperties): CSSProperties | undefined => {
  if (!toolbarStyle) {
    return undefined;
  }

  const nextStyle = { ...toolbarStyle };
  delete nextStyle.top;
  delete nextStyle.left;
  delete nextStyle.right;
  delete nextStyle.bottom;
  return nextStyle;
};

export const useFloatToolbarPortal = ({
  active,
  containerRef,
  toolbarContainerRef,
  toolbarStyle,
}: UseFloatToolbarPortalOptions): UseFloatToolbarPortalResult => {
  const [portalRect, setPortalRect] = useState<ToolbarPortalRect>(defaultPortalRect);
  const [portalRenderSnapshot, setPortalRenderSnapshot] = useState<ToolbarPortalRenderSnapshot | null>(null);
  const portalHostConfigRef = useRef<ToolbarPortalHostConfig | null>(null);
  const portalRafIdRef = useRef<number | null>(null);

  const updatePortalRect = useCallback(() => {
    const hostElement = containerRef.current;
    if (!hostElement) {
      return;
    }

    const nextPortalHostConfig = getToolbarPortalHostConfig(hostElement);
    portalHostConfigRef.current = nextPortalHostConfig;
    setPortalRenderSnapshot((prevSnapshot) => {
      if (!nextPortalHostConfig) {
        return prevSnapshot === null ? prevSnapshot : null;
      }

      if (
        prevSnapshot?.mountElement === nextPortalHostConfig.mountElement &&
        prevSnapshot?.positioningMode === nextPortalHostConfig.positioningMode
      ) {
        return prevSnapshot;
      }

      return {
        mountElement: nextPortalHostConfig.mountElement,
        positioningMode: nextPortalHostConfig.positioningMode,
      };
    });

    const nextRect = calculatePortalRect(hostElement, nextPortalHostConfig, toolbarStyle, toolbarContainerRef.current);
    setPortalRect((prevRect) => {
      if (
        prevRect.top === nextRect.top &&
        prevRect.left === nextRect.left &&
        prevRect.width === nextRect.width &&
        prevRect.height === nextRect.height
      ) {
        return prevRect;
      }
      return nextRect;
    });
  }, [containerRef, toolbarContainerRef, toolbarStyle]);

  const schedulePortalRectUpdate = useCallback(() => {
    if (portalRafIdRef.current !== null) {
      return;
    }

    portalRafIdRef.current = window.requestAnimationFrame(() => {
      portalRafIdRef.current = null;
      updatePortalRect();
    });
  }, [updatePortalRect]);

  const getPopupContainer = useCallback(
    (triggerNode?: HTMLElement) => {
      const fallbackContainer =
        triggerNode?.ownerDocument?.body ||
        containerRef.current?.ownerDocument?.body ||
        (typeof document !== 'undefined' ? document.body : null);

      return (portalHostConfigRef.current?.mountElement ||
        getToolbarPortalHostConfig(triggerNode || containerRef.current)?.mountElement ||
        fallbackContainer) as HTMLElement;
    },
    [containerRef],
  );

  useEffect(() => {
    if (!active) {
      return;
    }

    updatePortalRect();

    const handleViewportChange = () => {
      schedulePortalRectUpdate();
    };

    const container = containerRef.current;
    const mountElement = portalHostConfigRef.current?.mountElement;
    const positioningElement = portalHostConfigRef.current?.positioningElement;
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && container
        ? new ResizeObserver(() => {
            schedulePortalRectUpdate();
          })
        : null;

    if (container) {
      resizeObserver?.observe(container);
    }
    if (mountElement && mountElement !== container) {
      resizeObserver?.observe(mountElement);
    }
    if (positioningElement && positioningElement !== container && positioningElement !== mountElement) {
      resizeObserver?.observe(positioningElement);
    }

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [active, containerRef, schedulePortalRectUpdate, updatePortalRect]);

  useEffect(() => {
    return () => {
      if (portalRafIdRef.current !== null) {
        window.cancelAnimationFrame(portalRafIdRef.current);
      }
      portalHostConfigRef.current = null;
    };
  }, []);

  return {
    portalRect,
    portalRenderSnapshot,
    getPopupContainer,
    updatePortalRect,
    schedulePortalRectUpdate,
  };
};
