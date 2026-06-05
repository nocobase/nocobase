/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react';

const TOOLBAR_HIDE_DELAY = 180;
const CHILD_FLOAT_MENU_ACTIVITY_EVENT = 'nb-float-menu-child-activity';

interface UseFloatToolbarVisibilityOptions {
  modelUid: string;
  containerRef: RefObject<HTMLDivElement>;
  toolbarContainerRef: RefObject<HTMLDivElement>;
  updatePortalRect: () => void;
  schedulePortalRectUpdate: () => void;
}

interface UseFloatToolbarVisibilityResult {
  isToolbarVisible: boolean;
  shouldRenderToolbar: boolean;
  handleSettingsMenuOpenChange: (open: boolean) => void;
  handleChildHover: (e: ReactMouseEvent) => void;
  handleHostMouseEnter: () => void;
  handleHostMouseLeave: (e: ReactMouseEvent<HTMLDivElement>) => void;
  handleToolbarMouseEnter: () => void;
  handleToolbarMouseLeave: (e: ReactMouseEvent<HTMLDivElement>) => void;
  handleResizeDragStart: () => void;
  handleResizeDragEnd: () => void;
}

const isNodeWithin = (target: EventTarget | null, container: HTMLElement | null): boolean => {
  return target instanceof Node && !!container?.contains(target);
};

const getToolbarModelUidFromTarget = (target: EventTarget | null): string | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('.nb-toolbar-container[data-model-uid]')?.getAttribute('data-model-uid') || null;
};

const isNodeWithinDescendantFloatToolbar = (
  target: EventTarget | null,
  container: HTMLElement | null,
  currentModelUid: string,
): boolean => {
  const targetModelUid = getToolbarModelUidFromTarget(target);
  if (!container || !targetModelUid || targetModelUid === currentModelUid) {
    return false;
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-has-float-menu="true"][data-float-menu-model-uid]'),
  ).some(
    (hostElement) =>
      hostElement !== container && hostElement.getAttribute('data-float-menu-model-uid') === targetModelUid,
  );
};

export const useFloatToolbarVisibility = ({
  modelUid,
  containerRef,
  toolbarContainerRef,
  updatePortalRect,
  schedulePortalRectUpdate,
}: UseFloatToolbarVisibilityOptions): UseFloatToolbarVisibilityResult => {
  const [hideMenu, setHideMenu] = useState(false);
  const [isHostHovered, setIsHostHovered] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [isToolbarPinned, setIsToolbarPinned] = useState(false);
  const [isHidePending, setIsHidePending] = useState(false);
  const [activeChildToolbarIds, setActiveChildToolbarIds] = useState<string[]>([]);
  const hideToolbarTimerRef = useRef<number | null>(null);
  const reportedChildActivityToAncestorsRef = useRef(false);

  const hasActiveChildToolbar = activeChildToolbarIds.length > 0;
  const isToolbarVisible =
    !hideMenu && !hasActiveChildToolbar && (isHostHovered || isToolbarHovered || isDraggingToolbar || isToolbarPinned);
  const shouldRenderToolbar = isToolbarVisible || isToolbarPinned || isDraggingToolbar;
  const isToolbarInteractionActive =
    isHostHovered || isToolbarHovered || isDraggingToolbar || isToolbarPinned || isHidePending;

  const clearHideToolbarTimer = useCallback(() => {
    if (hideToolbarTimerRef.current !== null) {
      window.clearTimeout(hideToolbarTimerRef.current);
      hideToolbarTimerRef.current = null;
    }
    setIsHidePending(false);
  }, []);

  const scheduleHideToolbar = useCallback(() => {
    clearHideToolbarTimer();
    setIsHidePending(true);
    hideToolbarTimerRef.current = window.setTimeout(() => {
      hideToolbarTimerRef.current = null;
      setIsHidePending(false);
      if (isDraggingToolbar || isToolbarPinned) {
        return;
      }
      setIsHostHovered(false);
      setIsToolbarHovered(false);
    }, TOOLBAR_HIDE_DELAY);
  }, [clearHideToolbarTimer, isDraggingToolbar, isToolbarPinned]);

  const handleSettingsMenuOpenChange = useCallback((open: boolean) => {
    setIsToolbarPinned(open);
  }, []);

  useEffect(() => {
    const hostElement = containerRef.current;
    if (!hostElement) {
      return;
    }

    const handleChildToolbarActivity = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean; modelUid?: string }>;
      if (!(customEvent.target instanceof HTMLElement) || customEvent.target === hostElement) {
        return;
      }

      const childModelUid = customEvent.detail?.modelUid;
      if (!childModelUid) {
        return;
      }

      setActiveChildToolbarIds((prevIds) => {
        return customEvent.detail?.active
          ? prevIds.includes(childModelUid)
            ? prevIds
            : [...prevIds, childModelUid]
          : prevIds.filter((id) => id !== childModelUid);
      });
    };

    hostElement.addEventListener(CHILD_FLOAT_MENU_ACTIVITY_EVENT, handleChildToolbarActivity as EventListener);
    return () => {
      hostElement.removeEventListener(CHILD_FLOAT_MENU_ACTIVITY_EVENT, handleChildToolbarActivity as EventListener);
    };
  }, [containerRef]);

  useEffect(() => {
    const hostElement = containerRef.current;
    if (!hostElement || reportedChildActivityToAncestorsRef.current === isToolbarInteractionActive) {
      return;
    }

    reportedChildActivityToAncestorsRef.current = isToolbarInteractionActive;
    hostElement.dispatchEvent(
      new CustomEvent(CHILD_FLOAT_MENU_ACTIVITY_EVENT, {
        bubbles: true,
        detail: { active: isToolbarInteractionActive, modelUid },
      }),
    );
  }, [containerRef, isToolbarInteractionActive, modelUid]);

  useEffect(() => {
    const hostElement = containerRef.current;

    return () => {
      if (hostElement && reportedChildActivityToAncestorsRef.current) {
        hostElement.dispatchEvent(
          new CustomEvent(CHILD_FLOAT_MENU_ACTIVITY_EVENT, {
            bubbles: true,
            detail: { active: false, modelUid },
          }),
        );
        reportedChildActivityToAncestorsRef.current = false;
      }
      clearHideToolbarTimer();
    };
  }, [clearHideToolbarTimer, containerRef, modelUid]);

  useEffect(() => {
    if (isToolbarPinned) {
      clearHideToolbarTimer();
      updatePortalRect();
    }
  }, [clearHideToolbarTimer, isToolbarPinned, updatePortalRect]);

  const handleChildHover = useCallback(
    (e: ReactMouseEvent) => {
      const target = e.target as HTMLElement;
      const childWithMenu = target.closest('[data-has-float-menu]');
      const isCurrentHostTarget = !childWithMenu || childWithMenu === containerRef.current;

      if (isCurrentHostTarget) {
        clearHideToolbarTimer();
        setIsHostHovered(true);
      }

      setHideMenu(!!childWithMenu && childWithMenu !== containerRef.current);
    },
    [clearHideToolbarTimer, containerRef],
  );

  const handleHostMouseEnter = useCallback(() => {
    clearHideToolbarTimer();
    setHideMenu(false);
    updatePortalRect();
    setIsHostHovered(true);
  }, [clearHideToolbarTimer, updatePortalRect]);

  const handleHostMouseLeave = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isToolbarPinned) {
        setIsHostHovered(false);
        return;
      }
      if (isNodeWithin(e.relatedTarget, toolbarContainerRef.current)) {
        clearHideToolbarTimer();
        setIsHostHovered(false);
        setIsToolbarHovered(true);
        return;
      }
      if (isNodeWithinDescendantFloatToolbar(e.relatedTarget, containerRef.current, modelUid)) {
        clearHideToolbarTimer();
        setHideMenu(false);
        setIsHostHovered(true);
        return;
      }
      scheduleHideToolbar();
    },
    [clearHideToolbarTimer, containerRef, isToolbarPinned, modelUid, scheduleHideToolbar, toolbarContainerRef],
  );

  const handleToolbarMouseEnter = useCallback(() => {
    clearHideToolbarTimer();
    updatePortalRect();
    setIsHostHovered(false);
    setIsToolbarHovered(true);
  }, [clearHideToolbarTimer, updatePortalRect]);

  const handleToolbarMouseLeave = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isToolbarPinned) {
        setIsToolbarHovered(false);
        return;
      }
      setIsToolbarHovered(false);
      if (isNodeWithin(e.relatedTarget, containerRef.current)) {
        clearHideToolbarTimer();
        setIsHostHovered(true);
        return;
      }
      scheduleHideToolbar();
    },
    [clearHideToolbarTimer, containerRef, isToolbarPinned, scheduleHideToolbar],
  );

  const handleResizeDragStart = useCallback(() => {
    updatePortalRect();
    setIsDraggingToolbar(true);
    schedulePortalRectUpdate();
  }, [schedulePortalRectUpdate, updatePortalRect]);

  const handleResizeDragEnd = useCallback(() => {
    setIsDraggingToolbar(false);
    schedulePortalRectUpdate();
  }, [schedulePortalRectUpdate]);

  return {
    isToolbarVisible,
    shouldRenderToolbar,
    handleSettingsMenuOpenChange,
    handleChildHover,
    handleHostMouseEnter,
    handleHostMouseLeave,
    handleToolbarMouseEnter,
    handleToolbarMouseLeave,
    handleResizeDragStart,
    handleResizeDragEnd,
  };
};
