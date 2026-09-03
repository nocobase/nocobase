/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { CSSProperties, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import { vi } from 'vitest';
import { MobilePopup } from '../MobilePopup';
import { useMobileActionDrawerStyle } from '../MobilePopup.style';

vi.mock('antd-mobile', () => ({
  Popup: ({
    bodyClassName,
    bodyStyle,
    children,
    className,
    visible,
  }: {
    bodyClassName?: string;
    bodyStyle?: CSSProperties;
    children?: ReactNode;
    className?: string;
    visible?: boolean;
  }) =>
    visible ? (
      <div className={className} data-testid="popup-root">
        <div className={`adm-popup-body ${bodyClassName || ''}`} data-testid="popup-body" style={bodyStyle}>
          {children}
        </div>
      </div>
    ) : null,
}));

vi.mock('antd-mobile-icons', () => ({
  CloseOutline: () => <span data-testid="close-outline" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function StyleProbe() {
  const { componentCls, hashId } = useMobileActionDrawerStyle();

  return (
    <div className={`${componentCls} ${hashId}`}>
      <div className="nb-mobile-action-drawer-header" data-testid="drawer-header" />
      <div className="nb-mobile-action-drawer-body" data-testid="drawer-body" />
    </div>
  );
}

function getInjectedStyles() {
  return Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent || '')
    .join('\n')
    .replace(/\s+/g, '');
}

describe('MobilePopup styles', () => {
  it('mounts the action drawer class on the real popup body', async () => {
    render(
      <MobilePopup visible title="Edit" onClose={vi.fn()}>
        <div style={{ height: 1200 }}>Long content</div>
      </MobilePopup>,
    );

    const popupBody = await screen.findByTestId('popup-body');

    expect(screen.getByTestId('popup-root')).toHaveClass('ant-nb-mobile-action-drawer');
    expect(popupBody).toHaveClass('adm-popup-body');
    expect(popupBody).toHaveClass('nb-mobile-action-drawer-body');
    expect(popupBody).toHaveStyle({ padding: '0px' });
  });

  it('limits the mobile action drawer body by viewport height', async () => {
    render(
      <ConfigProvider>
        <StyleProbe />
      </ConfigProvider>,
    );

    await waitFor(() => {
      expect(getInjectedStyles()).toContain('.nb-mobile-action-drawer-body');
    });

    const styles = getInjectedStyles();

    expect(styles).toContain('height:var(--nb-mobile-page-header-height,46px)');
    expect(styles).toContain('max-height:calc(100vh-var(--nb-mobile-page-header-height,46px))');
    expect(styles).toContain('max-height:calc(100dvh-var(--nb-mobile-page-header-height,46px))');
    expect(styles).toContain('overflow-y:auto');
    expect(styles).not.toContain('max-height:calc(100%-var(--nb-mobile-page-header-height))');
  });
});
