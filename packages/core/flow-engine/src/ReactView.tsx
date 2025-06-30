/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider } from 'antd';
import React from 'react';
import { Root, RootOptions, createRoot } from 'react-dom/client';
import { FlowEngine } from './flowEngine';
import { FlowEngineProvider } from './provider';

function Provider({ config, engine, children }) {
  return (
    <FlowEngineProvider engine={engine}>
      <ConfigProvider {...config}>
        <App>{children}</App>
      </ConfigProvider>
    </FlowEngineProvider>
  );
}

export class ReactView {
  constructor(private flowEngine: FlowEngine) {}

  createRoot(container: HTMLElement, options: RootOptions = {}): Root {
    const root = createRoot(container, options);
    return {
      render: (children: React.ReactNode) => {
        root.render(
          <Provider engine={this.flowEngine} config={this.flowEngine.context['antdConfig']}>
            {children}
          </Provider>,
        );
      },
      unmount: () => {
        root.unmount();
      },
    };
  }

  render(children: React.ReactNode | ((root: Root) => React.ReactNode), options: any = {}) {
    const container = document.createElement('span');
    const { onRendered } = options;
    let root: Root;

    const renderContent = (root: Root) => {
      const content = typeof children === 'function' ? (children as (root: Root) => React.ReactNode)(root) : children;
      return (
        <Provider engine={this.flowEngine} config={this.flowEngine.context['antdConfig']}>
          {content}
        </Provider>
      );
    };

    if (onRendered) {
      onRendered(() => {
        root = createRoot(container);
        root.render(renderContent(root));
      });
    } else {
      root = createRoot(container);
      root.render(renderContent(root));
    }

    (container as any)._reactRoot = root;

    return container;
  }

  onRefReady<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
    const start = Date.now();
    function check() {
      if (ref.current) return cb(ref.current);
      if (Date.now() - start > timeout) return;
      setTimeout(check, 30);
    }
    check();
  }
}
