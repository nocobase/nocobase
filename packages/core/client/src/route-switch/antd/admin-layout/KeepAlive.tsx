/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentsContext, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import _ from 'lodash';
import React, { createContext, FC, useContext, useRef } from 'react';
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';
import { ACLContext } from '../../../acl/ACLProvider';
import { CurrentPageUidContext } from '../../../application/CustomRouterContextProvider';
import { SchemaComponentContext } from '../../../schema-component/context';

const KeepAliveContext = createContext(true);

/**
 * Intercept designable updates to prevent performance issues
 * @param param0
 * @returns
 */
const DesignableInterceptor: FC<{ active: boolean }> = ({ children, active }) => {
  const designableContext = useContext(SchemaComponentContext);
  const schemaOptionsContext = useContext(SchemaOptionsContext);
  const schemaComponentsContext = useContext(SchemaComponentsContext);
  const expressionScopeContext = useContext(SchemaExpressionScopeContext);
  const aclContext = useContext(ACLContext);

  const designableContextRef = useRef(designableContext);
  const schemaOptionsContextRef = useRef(schemaOptionsContext);
  const schemaComponentsContextRef = useRef(schemaComponentsContext);
  const expressionScopeContextRef = useRef(expressionScopeContext);
  const aclContextRef = useRef(aclContext);

  if (active) {
    designableContextRef.current = designableContext;
    schemaOptionsContextRef.current = schemaOptionsContext;
    schemaComponentsContextRef.current = schemaComponentsContext;
    expressionScopeContextRef.current = expressionScopeContext;
    aclContextRef.current = aclContext;
  }

  return (
    <SchemaComponentContext.Provider value={designableContextRef.current}>
      <SchemaOptionsContext.Provider value={schemaOptionsContextRef.current}>
        <SchemaComponentsContext.Provider value={schemaComponentsContextRef.current}>
          <SchemaExpressionScopeContext.Provider value={expressionScopeContextRef.current}>
            <ACLContext.Provider value={aclContextRef.current}>{children}</ACLContext.Provider>
          </SchemaExpressionScopeContext.Provider>
        </SchemaComponentsContext.Provider>
      </SchemaOptionsContext.Provider>
    </SchemaComponentContext.Provider>
  );
};

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
      <DesignableInterceptor active={active}>
        <UNSAFE_LocationContext.Provider value={prevLocationContextRef.current}>
          <UNSAFE_RouteContext.Provider value={prevRouteContextRef.current}>{children}</UNSAFE_RouteContext.Provider>
        </UNSAFE_LocationContext.Provider>
      </DesignableInterceptor>
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
  // If keep-alive is enabled in e2e environment, it makes locator selection difficult. So we disable keep-alive in e2e environment
  if (process.env.__E2E__) {
    return 1;
  }

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
