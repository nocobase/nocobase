/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useToken } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, { FC, useEffect } from 'react';
import classnames from 'classnames';
import { isDesktop } from 'react-device-detect';
import { PageBackgroundColor } from '../../../constants';

const getContentHeightBase = () => {
  if (isDesktop) {
    return '100%';
  }

  if (typeof CSS !== 'undefined' && CSS.supports?.('height', '100dvh')) {
    return '100dvh';
  }

  return '100vh';
};

export const MobilePageContentContainer: FC<{
  hideTabBar?: boolean;
  displayPageHeader?: boolean;
  className?: string;
}> = ({ children, hideTabBar, displayPageHeader = true, className }) => {
  const [mobileTabBarHeight, setMobileTabBarHeight] = React.useState(0);
  const [mobilePageHeader, setMobilePageHeader] = React.useState(0);
  const [mobileActionPageFooterHeight, setMobileActionPageFooterHeight] = React.useState(0);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { token } = useToken();
  const contentHeightBase = getContentHeightBase();
  const getMobileActionPageFooter = useMemoizedFn(() => {
    const actionPage = contentRef.current?.closest('.nb-mobile-action-page');

    if (!actionPage) {
      return null;
    }

    return (
      Array.from(actionPage.children).find(
        (element): element is HTMLDivElement =>
          element instanceof HTMLDivElement && element.classList.contains('nb-mobile-action-page-footer'),
      ) || null
    );
  });
  const getLayoutElements = useMemoizedFn(() => {
    const navigationBar = displayPageHeader
      ? _.last(document.querySelectorAll<HTMLDivElement>('.mobile-page-header'))
      : null;
    const mobileTabBar = hideTabBar ? null : document.querySelector<HTMLDivElement>('.mobile-tab-bar');
    const mobileActionPageFooter = getMobileActionPageFooter();

    return { mobileActionPageFooter, mobileTabBar, navigationBar };
  });
  const updateLayoutHeights = useMemoizedFn(() => {
    const { mobileActionPageFooter, mobileTabBar, navigationBar } = getLayoutElements();
    setMobilePageHeader(navigationBar?.offsetHeight || 0);
    setMobileTabBarHeight(mobileTabBar?.offsetHeight || 0);
    setMobileActionPageFooterHeight(mobileActionPageFooter?.offsetHeight || 0);
  });
  const occupiedHeight = (mobileTabBarHeight || 0) + (mobilePageHeader || 0) + (mobileActionPageFooterHeight || 0);
  const bottomSpacerHeight = (mobileTabBarHeight || 0) + (mobileActionPageFooterHeight || 0);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let animationFrame: number | null = null;
    let shouldObserveOnNextFrame = false;
    const scheduleLayoutUpdate = (shouldObserveLayoutElements = false) => {
      shouldObserveOnNextFrame = shouldObserveOnNextFrame || shouldObserveLayoutElements;
      if (animationFrame !== null) {
        return;
      }

      animationFrame = requestAnimationFrame(() => {
        const shouldObserve = shouldObserveOnNextFrame;
        shouldObserveOnNextFrame = false;
        animationFrame = null;
        updateLayoutHeights();
        if (shouldObserve) {
          observeLayoutElements();
        }
      });
    };
    const observeLayoutElements = () => {
      resizeObserver?.disconnect();
      Object.values(getLayoutElements())
        .filter(Boolean)
        .forEach((element) => {
          resizeObserver?.observe(element);
        });
    };
    const mutationObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            scheduleLayoutUpdate(true);
          });

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleLayoutUpdate();
      });
    }

    updateLayoutHeights();
    observeLayoutElements();
    scheduleLayoutUpdate();
    const mutationObserverTarget = document.querySelector<HTMLElement>('.mobile-container') || document.body;
    mutationObserver?.observe(mutationObserverTarget, { childList: true, subtree: true });
    const handleWindowResize = () => {
      scheduleLayoutUpdate(true);
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [displayPageHeader, getLayoutElements, hideTabBar, updateLayoutHeights]);
  return (
    <>
      {mobilePageHeader && displayPageHeader ? <div style={{ height: mobilePageHeader }}></div> : null}
      <div
        ref={contentRef}
        className={classnames('mobile-page-content', className)}
        data-testid="mobile-page-content"
        style={{
          height: `calc(${contentHeightBase} - ${occupiedHeight}px)`,
          boxSizing: 'border-box',
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: isDesktop ? undefined : 'auto',
          WebkitOverflowScrolling: isDesktop ? undefined : 'touch',
          backgroundColor: PageBackgroundColor,
          paddingInline: token.paddingPageHorizontal,
          paddingBlock: token.paddingPageVertical,
        }}
      >
        {children}
      </div>
      {bottomSpacerHeight ? <div style={{ height: bottomSpacerHeight }}></div> : null}
    </>
  );
};
