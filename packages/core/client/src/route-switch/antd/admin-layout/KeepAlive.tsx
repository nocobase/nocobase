/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React, { createContext, FC, useContext, useRef } from 'react';
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';
import { CurrentPageUidContext } from '../../../application/CustomRouterContextProvider';

const KeepAliveContext = createContext(true);

export const KeepAliveProvider: FC<{ active: boolean }> = ({ children, active }) => {
  const currentLocationContext = useContext(UNSAFE_LocationContext);
  const currentRouteContext = useContext(UNSAFE_RouteContext);
  const prevLocationContextRef = useRef(currentLocationContext);
  const prevRouteContextRef = useRef(currentRouteContext);

  if (
    active &&
    // Skip comparing location key to improve LocationContext rendering performance
    !_.isEqual(_.omit(prevLocationContextRef.current.location, 'key'), _.omit(currentLocationContext.location, 'key'))
  ) {
    prevLocationContextRef.current = currentLocationContext;
  }

  if (active && !_.isEqual(prevRouteContextRef.current, currentRouteContext)) {
    prevRouteContextRef.current = currentRouteContext;
  }

  // When the page is inactive, we use UNSAFE_LocationContext and UNSAFE_RouteContext to prevent child components
  // from receiving Context updates, thereby optimizing performance.
  // This is based on how React Context works:
  // 1. When Context value changes, React traverses the component tree from top to bottom
  // 2. During traversal, React finds components using that Context and marks them for update
  // 3. When encountering the same Context Provider, traversal stops, avoiding unnecessary child component updates
  return (
    <KeepAliveContext.Provider value={active}>
      <UNSAFE_LocationContext.Provider value={prevLocationContextRef.current}>
        <UNSAFE_RouteContext.Provider value={prevRouteContextRef.current}>{children}</UNSAFE_RouteContext.Provider>
      </UNSAFE_LocationContext.Provider>
    </KeepAliveContext.Provider>
  );
};

/**
 * Used on components that don't need KeepAlive context, to improve performance when Context values change
 * @returns
 */
export const KeepAliveContextCleaner: FC = ({ children }) => {
  return <KeepAliveContext.Provider value={true}>{children}</KeepAliveContext.Provider>;
};

/**
 * Get whether the current page is visible
 * @returns
 */
export const useKeepAlive = () => {
  const active = useContext(KeepAliveContext);
  return { active };
};

interface KeepAliveProps {
  uid: string;
  children: (uid: string) => React.ReactNode;
}

// Evaluate device performance to determine maximum number of cached pages
// Range: minimum 5, maximum 20
const getMaxPageCount = () => {
  const baseCount = 5;
  let performanceScore = baseCount;

  try {
    // Try using deviceMemory
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      return Math.min(Math.max(baseCount, memory * 3), 20);
    }

    // Try using performance.memory
    const perfMemory = (performance as any).memory;
    if (perfMemory?.jsHeapSizeLimit) {
      // jsHeapSizeLimit is in bytes
      const memoryGB = perfMemory.jsHeapSizeLimit / (1024 * 1024 * 1024);
      return Math.min(Math.max(baseCount, Math.floor(memoryGB * 3)), 20);
    }

    // Fallback: Use performance.now() to test execution speed
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
      // Simple performance test
    }
    const duration = performance.now() - start;

    // Adjust page count based on execution time
    if (duration < 3) {
      performanceScore = 20; // Very good performance
    } else if (duration < 5) {
      performanceScore = 10; // Average performance
    } else if (duration < 10) {
      performanceScore = 5;
    }
    // Use baseCount for poor performance

    return performanceScore;
  } catch (e) {
    // Return base count if any error occurs
    return baseCount;
  }
};

const MAX_RENDERED_PAGE_COUNT = getMaxPageCount();

/**
 * Implements a Vue-like KeepAlive effect
 */
export const KeepAlive: FC<KeepAliveProps> = React.memo(({ children, uid }) => {
  const renderedPageRef = useRef([]);

  if (!renderedPageRef.current.includes(uid)) {
    renderedPageRef.current.push(uid);
    if (renderedPageRef.current.length > MAX_RENDERED_PAGE_COUNT) {
      renderedPageRef.current = renderedPageRef.current.slice(-MAX_RENDERED_PAGE_COUNT);
    }
  }

  return (
    <>
      {renderedPageRef.current.map((renderedUid) => (
        <CurrentPageUidContext.Provider value={renderedUid} key={renderedUid}>
          <KeepAliveProvider active={renderedUid === uid}>{children(renderedUid)}</KeepAliveProvider>
        </CurrentPageUidContext.Provider>
      ))}
    </>
  );
});

KeepAlive.displayName = 'KeepAlive';
