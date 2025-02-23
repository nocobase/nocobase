/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, useApp, usePlugin } from '@nocobase/client';
import { useLocalStorageState } from 'ahooks';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import PluginEventflowClient from '.';

export const EventFlowContext = createContext(null);

export const useGetContainer = () => {
  const { currentRef } = useContext(EventFlowContext);
  return () => currentRef.current;
};

const width = '450px';

const ActiveEventFlow = (props) => {
  const app = useApp();
  const [active, setActive] = useLocalStorageState<string | undefined>(`${app.name}-active-eventflow`, {
    defaultValue: '',
  });

  useEffect(() => {
    const globalStyle = `
  html {
    padding-left: ${width};
  }
  html body {
    position: relative;
    overflow: hidden;
    transform: translateX(-${width});
  }
`;
    const styleElement = document.createElement('style');
    styleElement.innerHTML = globalStyle;
    if (active === 'true') {
      document.head.appendChild(styleElement);
    } else {
      try {
        document.head.removeChild(styleElement);
      } catch (error) {
        // empty
      }
    }
    // 清理函数，卸载时移除样式
    return () => {
      try {
        document.head.removeChild(styleElement);
      } catch (error) {
        // empty
      }
    };
  }, [active]);

  return (
    <EventFlowContext.Provider
      value={{
        currentRef: props.currentRef,
        active: active === 'true',
        setActive: (a) => setActive(a ? 'true' : ''),
      }}
    >
      {props.children}
    </EventFlowContext.Provider>
  );
};

export function EventFlowProvider(props) {
  const plugin = usePlugin(PluginEventflowClient);
  const currentRef = useRef();
  return (
    <ActiveEventFlow currentRef={currentRef}>
      {props.children}
      <EventFlowContext.Consumer>
        {({ active }) => {
          return active ? (
            <div
              ref={currentRef}
              className={css`
                position: fixed;
                right: -${width};
                z-index: 1;
                top: 0;
                width: ${width};
                height: 100vh;
                overflow: hidden;
                border-inline-start: 1px solid rgba(5, 5, 5, 0.06);
              `}
            >
              {plugin.renderRouter()}
            </div>
          ) : null;
        }}
      </EventFlowContext.Consumer>
    </ActiveEventFlow>
  );
}
