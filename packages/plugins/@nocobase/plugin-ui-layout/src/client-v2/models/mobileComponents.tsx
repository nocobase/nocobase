/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LeftOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFlowContext } from '@nocobase/flow-engine';
import { theme } from 'antd';
import React, { type ReactNode, useMemo } from 'react';
import { NAMESPACE } from '../../constants';

type TranslationContext = {
  t?: (key: string, options?: Record<string, unknown>) => string;
};

function translate(context: TranslationContext | undefined, key: string) {
  return typeof context?.t === 'function' ? context.t(key, { ns: [NAMESPACE, 'client'] }) : key;
}

export function MobileBackButton() {
  const ctx = useFlowContext();
  const label = translate(ctx, 'Back');

  if (ctx?.view?.type !== 'embed') {
    return <span aria-hidden="true" className="nb-ui-layout-mobile-back-spacer" />;
  }

  return (
    <button type="button" aria-label={label} className="nb-ui-layout-mobile-back-button" onClick={ctx.view.close}>
      <LeftOutlined />
    </button>
  );
}

export function useMobilePageClassName() {
  const { token } = theme.useToken();

  return useMemo(
    () => css`
      width: 100%;
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: ${token.colorBgLayout};

      .nb-ui-layout-mobile-titlebar {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) 44px;
        align-items: center;
        min-height: 48px;
        padding-top: env(safe-area-inset-top);
        background: ${token.colorBgContainer};
      }

      .nb-ui-layout-mobile-titlebar-left {
        grid-column: 1;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .nb-ui-layout-mobile-title {
        grid-column: 2;
        min-width: 0;
        text-align: center;
        color: ${token.colorText};
        font-size: ${token.fontSizeLG}px;
        font-weight: ${token.fontWeightStrong};
        line-height: ${token.lineHeightLG};
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .nb-ui-layout-mobile-body {
        flex: 1 1 0;
        min-height: 0;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        background: ${token.colorBgLayout};
        padding: 0;
      }

      .nb-ui-layout-mobile-tabs {
        flex: 1 1 0;
        min-height: 0;
        overflow: hidden;
      }

      .nb-ui-layout-mobile-tabs > .ant-tabs {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: ${token.colorText};
        background: ${token.colorBgLayout};
      }

      .nb-ui-layout-mobile-tabs > .ant-tabs > .ant-tabs-nav {
        flex: 0 0 auto;
        margin: 0;
        padding-top: env(safe-area-inset-top);
        background: ${token.colorBgContainer};
        border-bottom: 1px solid ${token.colorBorderSecondary};
      }

      .nb-ui-layout-mobile-tabs > .ant-tabs > .ant-tabs-nav::before {
        border-bottom: 0;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-nav-wrap {
        min-width: 0;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-nav-list {
        align-items: center;
      }

      .nb-ui-layout-mobile-page-tab-left-spacer {
        display: inline-block;
        width: ${token.paddingXS + token.marginXXS}px;
        height: 1px;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-tab {
        height: 40px;
        margin: 0;
        padding: 0 ${token.paddingXS}px;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-tab + .ant-tabs-tab {
        margin-left: ${token.marginXXS}px;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-tab-btn {
        max-width: 144px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: ${token.fontSize}px;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-extra-content {
        display: inline-flex;
        align-items: center;
        height: 40px;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-ink-bar {
        background: transparent;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-ink-bar::after {
        position: absolute;
        inset-block-end: 0;
        inset-inline: ${token.paddingXS}px;
        height: 2px;
        background: ${token.colorPrimary};
        content: '';
      }

      .nb-ui-layout-mobile-page-tab-add-wrapper {
        display: inline-flex;
        align-items: center;
        margin-inline-end: ${token.paddingXS}px;
      }

      .nb-ui-layout-mobile-page-tab-add {
        width: 32px;
        min-width: 32px;
        height: 32px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-content-holder {
        flex: 1 1 0;
        min-height: 0;
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        background: ${token.colorBgLayout};
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-content,
      .nb-ui-layout-mobile-tabs .ant-tabs-tabpane {
        height: 100%;
      }

      .nb-ui-layout-mobile-tabs .ant-tabs-tabpane {
        overflow: auto;
        -webkit-overflow-scrolling: touch;
        padding: 0;
      }

      .nb-ui-layout-mobile-back-button,
      .nb-ui-layout-mobile-back-spacer {
        width: 40px;
        height: 40px;
        min-width: 40px;
        border: 0;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: ${token.colorTextSecondary};
        line-height: 1;
      }

      .nb-ui-layout-mobile-back-button {
        cursor: pointer;
        border-radius: ${token.borderRadiusLG}px;
        font-size: 20px;
      }

      .nb-ui-layout-mobile-back-button:hover,
      .nb-ui-layout-mobile-back-button:focus-visible {
        color: ${token.colorText};
        background: ${token.colorFillTertiary};
      }

      .nb-ui-layout-mobile-back-button:active {
        color: ${token.colorText};
      }

      .nb-block-grid {
        overflow-x: hidden;
      }
    `,
    [
      token.colorBgContainer,
      token.colorBgLayout,
      token.colorBorderSecondary,
      token.colorFillTertiary,
      token.colorPrimary,
      token.colorText,
      token.colorTextSecondary,
      token.borderRadiusLG,
      token.fontSize,
      token.fontSizeLG,
      token.fontWeightStrong,
      token.lineHeightLG,
      token.marginXXS,
      token.paddingXS,
    ],
  );
}

export function MobilePageSurface(props: {
  title?: ReactNode;
  displayTitle?: boolean;
  titlebarLeft?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { title, displayTitle, titlebarLeft, children, className } = props;
  const pageClassName = useMobilePageClassName();
  const pageSurfaceClassName = `nb-ui-layout-mobile-surface ${pageClassName}${className ? ` ${className}` : ''}`;

  return (
    <div className={pageSurfaceClassName}>
      {displayTitle ? (
        <div className="nb-ui-layout-mobile-titlebar">
          {titlebarLeft ? <div className="nb-ui-layout-mobile-titlebar-left">{titlebarLeft}</div> : null}
          <div className="nb-ui-layout-mobile-title">{title}</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
