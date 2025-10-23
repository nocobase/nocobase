/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Drawer, FloatButton } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { lazy } from '@nocobase/client';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useT } from './locale';

const { FlowLogsPanel } = lazy(() => import('./panel'), 'FlowLogsPanel');

export const FlowDevtoolsProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const t = useT();
  const engine = useFlowEngine({ throwError: false }) as {
    logManager?: { options?: any; setOptions?: (o: any) => void };
  } | null;
  const [open, setOpen] = React.useState(false);
  const openDrawer = React.useCallback(() => setOpen(true), []);
  const closeDrawer = React.useCallback(() => setOpen(false), []);

  // 启动期初始化：尽早应用本地保存的日志发布选项，避免刷新后早期日志被默认规则丢弃
  React.useEffect(() => {
    try {
      const s = localStorage.getItem('nb.flow.logs.options');
      if (!s) return;
      const stored = JSON.parse(s);
      if (!stored || typeof stored !== 'object') return;
      const prev = engine?.logManager?.options || {};
      const next = Object.assign({}, prev, stored);
      engine?.logManager?.setOptions?.(next);
      // setOptions 已处理 capacity 到 bus，无需重复调用 bus.setCapacity
    } catch (e) {
      // 静默失败，避免影响启动
      console.warn('FlowDevtools: early apply options failed', e);
    }
  }, [engine]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const alt = e.altKey || (e.metaKey && e.shiftKey);
      if (ctrl && alt && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        openDrawer();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openDrawer]);

  return (
    <>
      {children}
      <Drawer
        open={open}
        onClose={closeDrawer}
        width={960}
        destroyOnClose
        maskClosable
        keyboard
        title={t('Flow DevTools')}
        styles={{ body: { padding: 12 } }}
      >
        {/* 内嵌日志面板 */}
        <div style={{ height: '100%', overflow: 'auto', background: '#fff' }}>
          <FlowLogsPanel />
        </div>
      </Drawer>
      <FloatButton
        icon={<BugOutlined />}
        type="default"
        style={{ right: 96, bottom: 96, zIndex: 2147483647 }}
        onClick={openDrawer}
        tooltip={t('Flow DevTools')}
      />
    </>
  );
};

export default FlowDevtoolsProvider;
