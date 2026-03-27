/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { HighlightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, useFlowEngine } from '@nocobase/flow-engine';
import { Result, theme as antdTheme } from 'antd';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';

type AdminLayoutContentProps = {
  onContentElementChange?: (element: HTMLDivElement | null) => void;
};

const layoutContentClass = css`
  display: flex;
  flex-direction: column;
  position: relative;
  height: calc(100vh - var(--nb-header-height));
  > div {
    position: relative;
  }
  .ant-layout-footer {
    position: absolute;
    bottom: 0;
    text-align: center;
    width: 100%;
    z-index: 0;
    padding: 0px 50px;
  }
`;

const pageContentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const mobileHeight = {
  height: `calc(100dvh - var(--nb-header-height))`,
};

/**
 * 检测当前浏览器是否支持 dvh，移动端支持时优先使用它计算可视区域高度。
 *
 * @returns {boolean} 是否支持 dvh 单位
 */
function isDvhSupported() {
  if (typeof document === 'undefined') {
    return false;
  }

  const testEl = document.createElement('div');
  testEl.style.height = '1dvh';
  return testEl.style.height === '1dvh';
}

const ShowTipWhenNoPages = observer(() => {
  const flowEngine = useFlowEngine();
  const { token } = antdTheme.useToken();
  const { t } = useTranslation();
  const location = useLocation();
  const allAccessRoutes = flowEngine.context.routeRepository?.listAccessible?.() || [];
  const designable = !!flowEngine.context.flowSettingsEnabled;

  if (allAccessRoutes.length === 0 && !designable && ['/admin', '/admin/'].includes(location.pathname)) {
    return (
      <Result
        icon={<HighlightOutlined style={{ fontSize: '8em', color: token.colorText }} />}
        title={t('No pages yet, please configure first')}
        subTitle={t(`Click the "UI Editor" icon in the upper right corner to enter the UI Editor mode`)}
      />
    );
  }

  return null;
});

/**
 * AdminLayout 内部使用的内容区容器。
 *
 * 内容区不再依赖独立 FlowModel，而是通过回调把挂载目标同步给 root model。
 */
export const AdminLayoutContent: FC<AdminLayoutContentProps> = ({ onContentElementChange }) => {
  const style = useMemo(() => (isDvhSupported() ? mobileHeight : undefined), []);
  const bindLayoutContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      // shell 直接渲染内容区时，仍需把挂载目标同步给 root model。
      onContentElementChange?.(node);
    },
    [onContentElementChange],
  );

  return (
    <div
      ref={bindLayoutContentRef}
      className={`${layoutContentClass} nb-subpages-slot-without-header-and-side`}
      style={style}
    >
      <div style={pageContentStyle}>
        <Outlet />
        <ShowTipWhenNoPages />
      </div>
    </div>
  );
};

/**
 * 兼容旧 API 的独立 LayoutContent 组件。
 *
 * 旧调用方可能只需要一个不带顶部和侧边栏的内容容器，
 * 这时不一定存在 AdminLayout root model，因此这里保留一个可独立渲染的版本。
 *
 * @example
 * ```typescript
 * <LayoutContent />
 * ```
 */
export const LayoutContent: FC = () => {
  return <AdminLayoutContent />;
};
