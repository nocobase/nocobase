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
import { TOOLBAR_DRAG_ACTIVITY_EVENT } from '../../../dnd';

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
  const [isDraggingToolbarItem, setIsDraggingToolbarItem] = useState(false);
  const [isToolbarPinned, setIsToolbarPinned] = useState(false);
  const [isHidePending, setIsHidePending] = useState(false);
  const [activeChildToolbarIds, setActiveChildToolbarIds] = useState<string[]>([]);
  const hideToolbarTimerRef = useRef<number | null>(null);
  const reportedChildActivityToAncestorsRef = useRef(false);
  const isHostHoveredRef = useRef(false);
  const isToolbarHoveredRef = useRef(false);
  const isDraggingToolbarRef = useRef(false);
  const isDraggingToolbarItemRef = useRef(false);
  const isToolbarPinnedRef = useRef(false);

  const setHostHovered = useCallback((value: boolean) => {
    isHostHoveredRef.current = value;
    setIsHostHovered(value);
  }, []);

  const setToolbarHovered = useCallback((value: boolean) => {
    isToolbarHoveredRef.current = value;
    setIsToolbarHovered(value);
  }, []);

  const setDraggingToolbar = useCallback((value: boolean) => {
    isDraggingToolbarRef.current = value;
    setIsDraggingToolbar(value);
  }, []);

  const setDraggingToolbarItem = useCallback((value: boolean) => {
    isDraggingToolbarItemRef.current = value;
    setIsDraggingToolbarItem(value);
  }, []);

  const setToolbarPinned = useCallback((value: boolean) => {
    isToolbarPinnedRef.current = value;
    setIsToolbarPinned(value);
  }, []);

  const hasActiveChildToolbar = activeChildToolbarIds.length > 0;
  const isToolbarVisible =
    !hideMenu &&
    !hasActiveChildToolbar &&
    (isHostHovered || isToolbarHovered || isDraggingToolbar || isDraggingToolbarItem || isToolbarPinned);
  const shouldRenderToolbar = isToolbarVisible || isToolbarPinned || isDraggingToolbar || isDraggingToolbarItem;
  const isToolbarInteractionActive =
    isHostHovered || isToolbarHovered || isDraggingToolbar || isDraggingToolbarItem || isToolbarPinned || isHidePending;

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
      if (isDraggingToolbarRef.current || isDraggingToolbarItemRef.current || isToolbarPinnedRef.current) {
        return;
      }
      setHostHovered(false);
      setToolbarHovered(false);
    }, TOOLBAR_HIDE_DELAY);
  }, [clearHideToolbarTimer, setHostHovered, setToolbarHovered]);

  const handleSettingsMenuOpenChange = useCallback(
    (open: boolean) => {
      setToolbarPinned(open);
    },
    [setToolbarPinned],
  );

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
    const ownerDocument = hostElement?.ownerDocument;
    if (!ownerDocument) {
      return;
    }

    const handleToolbarDragActivity = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean; modelUid?: string }>;
      if (customEvent.detail?.modelUid !== modelUid) {
        return;
      }

      if (customEvent.detail?.active) {
        clearHideToolbarTimer();
        setDraggingToolbarItem(true);
        return;
      }

      setDraggingToolbarItem(false);
      if (isHostHoveredRef.current || isToolbarHoveredRef.current || isToolbarPinnedRef.current) {
        clearHideToolbarTimer();
        return;
      }

      scheduleHideToolbar();
    };

    ownerDocument.addEventListener(TOOLBAR_DRAG_ACTIVITY_EVENT, handleToolbarDragActivity as EventListener);
    return () => {
      ownerDocument.removeEventListener(TOOLBAR_DRAG_ACTIVITY_EVENT, handleToolbarDragActivity as EventListener);
    };
  }, [clearHideToolbarTimer, containerRef, modelUid, scheduleHideToolbar, setDraggingToolbarItem]);

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
        setHostHovered(true);
      }

      setHideMenu(!!childWithMenu && childWithMenu !== containerRef.current);
    },
    [clearHideToolbarTimer, containerRef, setHostHovered],
  );

  const handleHostMouseEnter = useCallback(() => {
    clearHideToolbarTimer();
    setHideMenu(false);
    updatePortalRect();
    setHostHovered(true);
  }, [clearHideToolbarTimer, setHostHovered, updatePortalRect]);

  const handleHostMouseLeave = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isToolbarPinnedRef.current) {
        setHostHovered(false);
        return;
      }
      if (isNodeWithin(e.relatedTarget, toolbarContainerRef.current)) {
        clearHideToolbarTimer();
        setHostHovered(false);
        setToolbarHovered(true);
        return;
      }
      if (isNodeWithinDescendantFloatToolbar(e.relatedTarget, containerRef.current, modelUid)) {
        clearHideToolbarTimer();
        setHideMenu(false);
        setHostHovered(true);
        return;
      }
      scheduleHideToolbar();
    },
    [
      clearHideToolbarTimer,
      containerRef,
      modelUid,
      scheduleHideToolbar,
      setHostHovered,
      setToolbarHovered,
      toolbarContainerRef,
    ],
  );

  const handleToolbarMouseEnter = useCallback(() => {
    clearHideToolbarTimer();
    updatePortalRect();
    setHostHovered(false);
    setToolbarHovered(true);
  }, [clearHideToolbarTimer, setHostHovered, setToolbarHovered, updatePortalRect]);

  const handleToolbarMouseLeave = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isToolbarPinnedRef.current || isDraggingToolbarItemRef.current) {
        clearHideToolbarTimer();
        setToolbarHovered(false);
        return;
      }
      setToolbarHovered(false);
      if (isNodeWithin(e.relatedTarget, containerRef.current)) {
        clearHideToolbarTimer();
        setHostHovered(true);
        return;
      }
      scheduleHideToolbar();
    },
    [clearHideToolbarTimer, containerRef, scheduleHideToolbar, setHostHovered, setToolbarHovered],
  );

  const handleResizeDragStart = useCallback(() => {
    updatePortalRect();
    setDraggingToolbar(true);
    schedulePortalRectUpdate();
  }, [schedulePortalRectUpdate, setDraggingToolbar, updatePortalRect]);

  const handleResizeDragEnd = useCallback(() => {
    setDraggingToolbar(false);
    schedulePortalRectUpdate();
  }, [schedulePortalRectUpdate, setDraggingToolbar]);

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
