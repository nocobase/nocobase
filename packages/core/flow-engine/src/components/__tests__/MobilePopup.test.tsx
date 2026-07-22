/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobilePopup } from '../MobilePopup';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../MobilePopup.style', () => ({
  useMobileActionDrawerStyle: () => ({
    componentCls: 'nb-mobile-action-drawer',
    hashId: 'hash',
  }),
}));

vi.mock('../../lazy-helper', () => ({
  lazy: (_loader: unknown, name: string) => {
    if (name === 'Popup') {
      const Popup = ({
        children,
        bodyStyle,
        maskStyle,
        style,
      }: {
        children: React.ReactNode;
        bodyStyle?: React.CSSProperties;
        maskStyle?: React.CSSProperties;
        style?: React.CSSProperties;
      }) => (
        <div data-testid="mobile-popup" style={style}>
          <div data-testid="mobile-popup-mask" style={maskStyle} />
          <div data-testid="mobile-popup-body" style={bodyStyle}>
            {children}
          </div>
        </div>
      );

      return { Popup };
    }

    return {
      CloseOutline: () => <span data-testid="close-outline" />,
    };
  },
}));

describe('MobilePopup', () => {
  const MobilePopupWithDrawerStyles = MobilePopup as React.ComponentType<
    React.ComponentProps<typeof MobilePopup> & { styles?: { body?: React.CSSProperties } }
  >;

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constrains the default popup to the dynamic viewport and keeps the body scrollable', () => {
    vi.stubGlobal('CSS', {
      supports: vi.fn((property: string, value: string) => property === 'height' && value === '100dvh'),
    });

    render(
      <MobilePopup visible title="Title" onClose={vi.fn()}>
        body
      </MobilePopup>,
    );

    const maxHeight = 'calc(100dvh - var(--nb-mobile-page-header-height, 46px))';

    expect(screen.getByTestId('mobile-popup')).toHaveStyle({ maxHeight });
    expect(screen.getByTestId('mobile-popup-body')).toHaveStyle({
      maxHeight,
      overflowY: 'auto',
      overflowX: 'hidden',
    });
  });

  it('falls back to the layout viewport when dynamic viewport units are unavailable', () => {
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => false),
    });

    render(
      <MobilePopup visible title="Title" onClose={vi.fn()}>
        body
      </MobilePopup>,
    );

    expect(screen.getByTestId('mobile-popup-body')).toHaveStyle({
      maxHeight: 'calc(100vh - var(--nb-mobile-page-header-height, 46px))',
    });
  });

  it('applies drawer body styles as max bounds without forcing fixed half-window height', () => {
    render(
      <MobilePopupWithDrawerStyles visible title="Title" styles={{ body: { maxHeight: '50vh' } }} onClose={vi.fn()}>
        body
      </MobilePopupWithDrawerStyles>,
    );

    expect(screen.getByTestId('mobile-popup')).toHaveStyle({
      maxHeight: '50vh',
    });
    expect(screen.getByTestId('mobile-popup-body')).toHaveStyle({
      maxHeight: '50vh',
    });
    expect(screen.getByTestId('mobile-popup-mask')).not.toHaveStyle({
      maxHeight: '50vh',
    });
  });

  it('closes from the header close icon with Enter or Space', () => {
    const onClose = vi.fn();
    render(
      <MobilePopup visible title="Title" onClose={onClose}>
        body
      </MobilePopup>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.keyDown(closeButton, { key: 'Enter' });
    fireEvent.keyDown(closeButton, { key: ' ' });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps long header titles in a constrained title element separate from the close button', () => {
    const longTitle = 'A very long table column title that should not push the close button outside the drawer';

    render(
      <MobilePopup visible title={longTitle} onClose={vi.fn()}>
        body
      </MobilePopup>,
    );

    expect(screen.getByText(longTitle)).toHaveClass('nb-mobile-action-drawer-title');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('nb-mobile-action-drawer-close-icon');
  });
});
