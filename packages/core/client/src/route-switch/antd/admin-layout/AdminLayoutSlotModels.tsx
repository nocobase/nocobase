/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EllipsisOutlined, HighlightOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FlowModel } from '@nocobase/flow-engine';
import { Popover, Result } from 'antd';
import React, { FC, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { PinnedPluginList } from '../../../plugin-manager';
import { useDesignable } from '../../../schema-component/hooks';
import { useToken } from '../../../style';
import { useAllAccessDesktopRoutes } from '../../../admin-shell';

type LayoutContentHost = FlowModel & {
  setLayoutContentElement?: (element: HTMLElement | null) => void;
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

const popoverStyle = css`
  .ant-popover-inner {
    padding: 0;
    overflow: hidden;
  }
`;

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

const ShowTipWhenNoPages = () => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { designable } = useDesignable();
  const { token } = useToken();
  const { t } = useTranslation();
  const location = useLocation();

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
};

const AdminLayoutContentView: FC<{ host?: LayoutContentHost | null }> = ({ host }) => {
  const style = useMemo(() => (isDvhSupported() ? mobileHeight : undefined), []);
  const layoutContentRef = useRef<HTMLDivElement>(null);

  const bindLayoutContentRef = useCallback(
    (node: HTMLDivElement | null) => {
      layoutContentRef.current = node;
      host?.setLayoutContentElement?.(node);
    },
    [host],
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
  return <AdminLayoutContentView />;
};

const MobileActions: FC = () => {
  const { token } = useToken();
  const [open, setOpen] = useState(false);

  const handleContentClick = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Popover
      rootClassName={popoverStyle}
      content={<PinnedPluginList onClick={handleContentClick} />}
      color={token.colorBgHeader}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
    >
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', height: '100%', marginRight: -16 }}>
        <EllipsisOutlined
          style={{
            color: token.colorTextHeaderMenu,
            fontSize: 20,
          }}
        />
      </div>
    </Popover>
  );
};

/**
 * Layout 内容区子模型。
 *
 * 它负责把页面主体渲染收进 FlowModel，同时把 subpage 的挂载目标同步回 root model，
 * 这样后续可以继续把内容区周边能力往子模型上迁移，而不影响现有路由行为。
 *
 * @example
 * ```typescript
 * rootModel.subModels.layoutContent
 * ```
 */
export class AdminLayoutContentModel extends FlowModel {
  protected onUnmount(): void {
    const host = this.parent as LayoutContentHost | undefined;
    host?.setLayoutContentElement?.(null);
    super.onUnmount();
  }

  render() {
    return <AdminLayoutContentView host={this.parent as LayoutContentHost | undefined} />;
  }
}

/**
 * Layout 右上角操作区子模型。
 *
 * 这里先只托管已有的插件区渲染，不改变交互逻辑；
 * 后续再继续拆成更细的 header subModels。
 *
 * @example
 * ```typescript
 * rootModel.subModels.headerActions
 * ```
 */
export class AdminLayoutHeaderActionsModel extends FlowModel {
  render() {
    if (this.props.isMobile) {
      return <MobileActions />;
    }

    return <PinnedPluginList />;
  }
}
