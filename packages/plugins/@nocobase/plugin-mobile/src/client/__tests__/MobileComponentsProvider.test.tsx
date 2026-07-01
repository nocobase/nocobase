/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@nocobase/test/client';
import React from 'react';
import { vi } from 'vitest';
import { MobileComponentsProvider } from '../MobileComponentsProvider';

type OpenModeProviderMockProps = {
  children: React.ReactNode;
  defaultOpenMode?: string;
  isMobile?: boolean;
  openModeToComponent: {
    drawer: React.ComponentType;
    [key: string]: React.ComponentType;
  };
};

type OpenModeProviderOptions = Omit<OpenModeProviderMockProps, 'children'>;

const mocks = vi.hoisted(() => ({
  openModeProviderProps: [] as OpenModeProviderOptions[],
  isMobileLayout: vi.fn(() => false),
  isAdminPage: vi.fn(() => true),
  isPopupVisibleControlledByURL: vi.fn(() => true),
}));

vi.mock('react-device-detect', () => ({
  isMobile: true,
}));

vi.mock('antd-style', () => ({
  createGlobalStyle: () => () => null,
}));

vi.mock('@nocobase/client-v2', () => ({
  useMobileLayout: () => ({ isMobileLayout: mocks.isMobileLayout() }),
}));

vi.mock('@nocobase/client', () => ({
  Action: {
    Page: () => <div data-testid="action-page" />,
  },
  OpenModeProvider: ({ children, ...props }: OpenModeProviderMockProps) => {
    mocks.openModeProviderProps.push(props);
    return <div data-testid="open-mode-provider">{children}</div>;
  },
  SchemaComponentOptions: ({ children }) => <div data-testid="schema-component-options">{children}</div>,
  usePopupSettings: () => ({
    isPopupVisibleControlledByURL: mocks.isPopupVisibleControlledByURL,
  }),
  useIsAdminPage: () => mocks.isAdminPage(),
}));

vi.mock('../adaptor-of-desktop/ActionDrawer', () => ({
  ActionDrawerUsedInMobile: () => <div data-testid="mobile-action-drawer" />,
  useToAdaptActionDrawerToMobile: vi.fn(),
}));

vi.mock('../adaptor-of-desktop/FilterAction', () => ({
  useToAdaptFilterActionToMobile: vi.fn(),
}));

vi.mock('../pages/dynamic-page/MobilePage', () => ({
  mobileComponents: {},
}));

describe('MobileComponentsProvider', () => {
  beforeEach(() => {
    mocks.openModeProviderProps.length = 0;
    mocks.isMobileLayout.mockReturnValue(false);
    mocks.isAdminPage.mockReturnValue(true);
    mocks.isPopupVisibleControlledByURL.mockReturnValue(true);
  });

  it('adapts URL-controlled drawer popups to subpages on mobile v1 admin pages', () => {
    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.getByTestId('open-mode-provider')).toBeInTheDocument();
    expect(screen.getByTestId('schema-component-options')).toContainElement(screen.getByTestId('content'));

    const providerProps = mocks.openModeProviderProps[0];
    expect(providerProps.defaultOpenMode).toBe('page');

    const DrawerComponent = providerProps.openModeToComponent.drawer;
    render(<DrawerComponent />);

    expect(screen.getByTestId('action-page')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-action-drawer')).not.toBeInTheDocument();
  });

  it('does not mount the mobile adapter for non-admin mobile routes', () => {
    mocks.isAdminPage.mockReturnValue(false);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.queryByTestId('open-mode-provider')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(mocks.openModeProviderProps).toHaveLength(0);
  });

  it('does not mount the mobile adapter for non-admin routes when the mobile layout flag is stale', () => {
    mocks.isAdminPage.mockReturnValue(false);
    mocks.isMobileLayout.mockReturnValue(true);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.queryByTestId('open-mode-provider')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(mocks.openModeProviderProps).toHaveLength(0);
  });
});
