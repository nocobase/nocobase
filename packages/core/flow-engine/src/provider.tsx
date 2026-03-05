/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, ConfigProvider, theme } from 'antd';
import React, { useContext, useEffect } from 'react';
import { useFlowEngine } from './engineContext';
import { useDialog, useDrawer, usePage, usePopover } from './views';
import { FlowViewer } from './views/FlowView';

export const FlowEngineGlobalsContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { modal, message, notification } = App.useApp();
  const [drawer, contextHolder] = useDrawer();
  const [embed, pageContextHolder] = usePage();
  const [popover, popoverContextHolder] = usePopover();
  const [dialog, dialogContextHolder] = useDialog();
  const engine = useFlowEngine();
  const config = useContext(ConfigProvider.ConfigContext);
  const { token } = theme.useToken();

  useEffect(() => {
    const context = {
      antdConfig: config,
      // themeToken 改为可观察的 getter，在下方单独 define
      modal,
      message,
      notification,
    };
    engine.context.defineProperty('viewer', {
      cache: false,
      get: (ctx) => new FlowViewer(ctx, { drawer, embed, popover, dialog }),
    });
    for (const item of Object.entries(context)) {
      const [key, value] = item;
      if (value) {
        engine.context.defineProperty(key, { value });
      }
    }
    // 将 themeToken 定义为 observable, 使组件能够响应主题的变更
    // NOTE: 必须在 antdConfig 写入后再更新 themeToken；否则会读取到旧 antdConfig 的值。
    engine.context.defineProperty('themeToken', {
      get: () => token,
      observable: true,
      cache: true,
    });
    engine.reactView.refresh();
  }, [engine, drawer, modal, message, notification, config, popover, token, dialog, embed]);

  return (
    <ConfigProvider {...config} locale={engine.context.locales?.antd} popupMatchSelectWidth={false}>
      {children}
      {contextHolder as any}
      {popoverContextHolder as any}
      {pageContextHolder as any}
      {dialogContextHolder as any}
      {/* The modal context is provided by App.useApp() */}
    </ConfigProvider>
  );
};

export { FlowEngineProvider, useFlowEngine, useFlowEngineContext } from './engineContext';
