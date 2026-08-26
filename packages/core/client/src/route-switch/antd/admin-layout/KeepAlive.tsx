/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RouteContext } from '@ant-design/pro-layout';
import { SchemaComponentsContext, SchemaExpressionScopeContext, SchemaOptionsContext } from '@formily/react';
import _ from 'lodash';
import { Context as MotionContext } from 'rc-motion/es/context';
import React, { createContext, FC, memo, useContext, useRef } from 'react';
import {
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
} from 'react-router-dom';
import { ACLContext } from '../../../acl/ACLProvider';
import { IsSubPageClosedByPageMenuContext } from '../../../application/CustomRouterContextProvider';
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

const hidden = { display: 'none' };

export const KeepAliveProvider: FC<{ active: boolean; parentActive: boolean }> = memo(
  ({ children, active, parentActive }) => {
    const currentLocationContext = useContext(UNSAFE_LocationContext);
    const currentRouteContext = useContext(UNSAFE_RouteContext);
    const currentDataRouterContext = useContext(UNSAFE_DataRouterContext);
    const currentDataRouterStateContext = useContext(UNSAFE_DataRouterStateContext);
    const subPageClosedContext = useContext(IsSubPageClosedByPageMenuContext);
    const motionContext = useContext(MotionContext);
    const routeContextValue = useContext(RouteContext);

    const prevLocationContextRef = useRef(currentLocationContext);
    const prevRouteContextRef = useRef(currentRouteContext);
    const prevDataRouterContextRef = useRef(currentDataRouterContext);
    const prevDataRouterStateContextRef = useRef(currentDataRouterStateContext);
    const prevSubPageClosedContextRef = useRef(subPageClosedContext);
    const prevMotionContextRef = useRef(motionContext);
    const prevRouteContextValueRef = useRef(routeContextValue);

    if (active) {
      prevDataRouterContextRef.current = currentDataRouterContext;
      prevDataRouterStateContextRef.current = currentDataRouterStateContext;
      prevSubPageClosedContextRef.current = subPageClosedContext;
      prevMotionContextRef.current = motionContext;
      prevRouteContextValueRef.current = routeContextValue;
    }

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

    const contextProviders = (
      <RouteContext.Provider value={prevRouteContextValueRef.current}>
        <MotionContext.Provider value={prevMotionContextRef.current}>
          <UNSAFE_DataRouterContext.Provider value={prevDataRouterContextRef.current}>
            <UNSAFE_DataRouterStateContext.Provider value={prevDataRouterStateContextRef.current}>
              <UNSAFE_LocationContext.Provider value={prevLocationContextRef.current}>
                <UNSAFE_RouteContext.Provider value={prevRouteContextRef.current}>
                  <KeepAliveContext.Provider value={parentActive === false ? false : active}>
                    <DesignableInterceptor active={active}>
                      <IsSubPageClosedByPageMenuContext.Provider value={prevSubPageClosedContextRef.current}>
                        {children}
                      </IsSubPageClosedByPageMenuContext.Provider>
                    </DesignableInterceptor>
                  </KeepAliveContext.Provider>
                </UNSAFE_RouteContext.Provider>
              </UNSAFE_LocationContext.Provider>
            </UNSAFE_DataRouterStateContext.Provider>
          </UNSAFE_DataRouterContext.Provider>
        </MotionContext.Provider>
      </RouteContext.Provider>
    );

    return <div style={active ? null : hidden}>{contextProviders}</div>;
  },
);

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

const MINIMUM_CACHED_PAGES = 5;
const MAXIMUM_CACHED_PAGES = 15;

const getMaxPageCount = () => {
  const baseCount = MINIMUM_CACHED_PAGES;

  try {
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      return Math.min(Math.max(baseCount, memory * 3), MAXIMUM_CACHED_PAGES);
    }

    const cores = navigator.hardwareConcurrency;
    if (cores) {
      return cores >= 8 ? MAXIMUM_CACHED_PAGES : cores >= 4 ? 7 : baseCount;
    }

    const start = performance.now();
    let result = 0;
    for (let i = 0; i < 500000; i++) {
      result += Math.sqrt(i);
    }
    if (result < 0) {
      console.log(result);
    }

    const duration = performance.now() - start;

    if (duration < 5) {
      return MAXIMUM_CACHED_PAGES;
    } else if (duration < 15) {
      return 10;
    }

    return baseCount;
  } catch (e) {
    return baseCount;
  }
};

const MAX_RENDERED_PAGE_COUNT = getMaxPageCount();

console.log(`[NocoBase] Maximum cached pages set to: ${MAX_RENDERED_PAGE_COUNT}`);

/**
 * Implements a Vue-like KeepAlive effect
 */
export const KeepAlive: FC<KeepAliveProps> = React.memo(({ children, uid }) => {
  const { active } = useKeepAlive();
  const renderedUidListRef = useRef([]);

  if (!renderedUidListRef.current.includes(uid)) {
    renderedUidListRef.current.push(uid);
    if (renderedUidListRef.current.length > MAX_RENDERED_PAGE_COUNT) {
      renderedUidListRef.current = renderedUidListRef.current.slice(-MAX_RENDERED_PAGE_COUNT);
    }
  }

  return (
    <>
      {renderedUidListRef.current.map((renderedUid) => (
        <KeepAliveProvider active={renderedUid === uid} key={renderedUid} parentActive={active}>
          {children(renderedUid)}
        </KeepAliveProvider>
      ))}
    </>
  );
});

KeepAlive.displayName = 'KeepAlive';
