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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileComponentsProvider } from '../MobileComponentsProvider';
import { mobileComponents } from '../pages/dynamic-page/MobilePage';

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
  adaptActionDrawerToMobile: vi.fn(),
  adaptFilterActionToMobile: vi.fn(),
  designable: vi.fn(() => false),
  screens: vi.fn(() => ({ md: false })),
}));

const setWindowInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
};

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => mocks.screens(),
    },
  };
});

vi.mock('antd-style', () => ({
  createGlobalStyle: () => () => null,
}));

vi.mock('@nocobase/client-v2', () => ({
  useMobileLayout: () => ({ isMobileLayout: mocks.isMobileLayout() }),
}));

vi.mock('@nocobase/client', () => ({
  Action: {
    Container: () => <div data-testid="action-container" />,
    Page: () => <div data-testid="action-page" />,
  },
  AssociationField: Object.assign(() => <div data-testid="association-field" />, {
    AddNewer: () => <div data-testid="association-add-newer" />,
    FileSelector: () => <div data-testid="association-file-selector" />,
    InternalSelect: () => <div data-testid="association-internal-select" />,
    Nester: () => <div data-testid="association-nester" />,
    ReadPretty: () => <div data-testid="association-read-pretty" />,
    Selector: () => <div data-testid="association-selector" />,
    SubTable: () => <div data-testid="association-sub-table" />,
    Viewer: () => <div data-testid="association-viewer" />,
  }),
  DatePicker: Object.assign(() => <div data-testid="date-picker" />, {
    FilterWithPicker: () => <div data-testid="date-filter-with-picker" />,
  }),
  OpenModeProvider: ({ children, ...props }: OpenModeProviderMockProps) => {
    mocks.openModeProviderProps.push(props);
    return <div data-testid="open-mode-provider">{children}</div>;
  },
  RemoteSchemaComponent: () => <div data-testid="remote-schema-component" />,
  SchemaComponentOptions: ({ children, components }) => (
    <div
      data-testid="schema-component-options"
      data-component-keys={Object.keys(components || {})
        .sort()
        .join(',')}
      data-has-mobile-select={components?.Select ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
  Select: () => <div data-testid="desktop-select" />,
  TimePicker: () => <div data-testid="time-picker" />,
  useDesignable: () => ({ designable: mocks.designable() }),
  useIsAdminPage: () => mocks.isAdminPage(),
  usePopupSettings: () => ({
    isPopupVisibleControlledByURL: mocks.isPopupVisibleControlledByURL,
  }),
}));

vi.mock('antd-mobile', () => ({
  Button: () => <div data-testid="mobile-button" />,
  Dialog: () => <div data-testid="mobile-dialog" />,
}));

vi.mock('../adaptor-of-desktop/ActionDrawer', () => ({
  ActionDrawerUsedInMobile: () => <div data-testid="mobile-action-drawer" />,
  useToAdaptActionDrawerToMobile: mocks.adaptActionDrawerToMobile,
}));

vi.mock('../adaptor-of-desktop/FilterAction', () => ({
  useToAdaptFilterActionToMobile: mocks.adaptFilterActionToMobile,
}));

vi.mock('../pages/dynamic-page/components/MobileDatePicker', () => ({
  MobileDateFilterWithPicker: () => <div data-testid="mobile-date-filter-with-picker" />,
  MobileDateTimePicker: () => <div data-testid="mobile-date-time-picker" />,
  MobileRangePicker: () => <div data-testid="mobile-range-picker" />,
  MobileTimePicker: () => <div data-testid="mobile-time-picker" />,
}));

vi.mock('../pages/dynamic-page/components/MobilePicker', () => ({
  MobilePicker: () => <div data-testid="mobile-picker" />,
}));

describe('MobileComponentsProvider', () => {
  beforeEach(() => {
    mocks.openModeProviderProps.length = 0;
    mocks.adaptActionDrawerToMobile.mockClear();
    mocks.adaptFilterActionToMobile.mockClear();
    mocks.isMobileLayout.mockReturnValue(false);
    mocks.isAdminPage.mockReturnValue(true);
    mocks.isPopupVisibleControlledByURL.mockReturnValue(true);
    mocks.designable.mockReturnValue(false);
    mocks.screens.mockReturnValue({ md: false });
    setWindowInnerWidth(1024);
  });

  it('applies mobile field components without open mode overrides in responsive admin pages', () => {
    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.getByTestId('schema-component-options')).toHaveAttribute('data-has-mobile-select', 'true');
    expect(screen.getByTestId('schema-component-options')).toHaveAttribute('data-component-keys', 'Select');
    expect(screen.getByTestId('schema-component-options')).toContainElement(screen.getByTestId('content'));
    expect(screen.queryByTestId('open-mode-provider')).not.toBeInTheDocument();
    expect(mocks.openModeProviderProps).toHaveLength(0);
    expect(mocks.adaptActionDrawerToMobile).not.toHaveBeenCalled();
    expect(mocks.adaptFilterActionToMobile).not.toHaveBeenCalled();
  });

  it('keeps the full mobile adapter for mobile layout routes', () => {
    mocks.isMobileLayout.mockReturnValue(true);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.getByTestId('open-mode-provider')).toBeInTheDocument();
    expect(screen.getByTestId('schema-component-options')).toContainElement(screen.getByTestId('content'));
    expect(screen.getByTestId('schema-component-options')).toHaveAttribute(
      'data-component-keys',
      'AssociationField,Button,DatePicker,Modal,Select,TimePicker,UnixTimestamp',
    );
    expect(mocks.openModeProviderProps[0]).toMatchObject({
      defaultOpenMode: 'page',
      isMobile: true,
    });
    expect(mocks.adaptActionDrawerToMobile).toHaveBeenCalled();
    expect(mocks.adaptFilterActionToMobile).toHaveBeenCalled();
  });

  it('does not apply responsive admin field components to non-admin routes', () => {
    mocks.isAdminPage.mockReturnValue(false);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.queryByTestId('schema-component-options')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(mocks.openModeProviderProps).toHaveLength(0);
    expect(mocks.adaptActionDrawerToMobile).not.toHaveBeenCalled();
    expect(mocks.adaptFilterActionToMobile).not.toHaveBeenCalled();
  });

  it('does not apply responsive admin field components on wide admin pages', () => {
    mocks.screens.mockReturnValue({ md: true });

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.queryByTestId('schema-component-options')).not.toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(mocks.openModeProviderProps).toHaveLength(0);
    expect(mocks.adaptActionDrawerToMobile).not.toHaveBeenCalled();
    expect(mocks.adaptFilterActionToMobile).not.toHaveBeenCalled();
  });

  it('applies mobile field components when breakpoint is unresolved on narrow admin pages', () => {
    mocks.screens.mockReturnValue({ md: undefined });
    setWindowInnerWidth(390);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.getByTestId('schema-component-options')).toHaveAttribute('data-has-mobile-select', 'true');
    expect(screen.getByTestId('schema-component-options')).toHaveAttribute('data-component-keys', 'Select');
    expect(screen.queryByTestId('open-mode-provider')).not.toBeInTheDocument();
  });

  it('does not apply responsive admin field components when breakpoint is unresolved on wide admin pages', () => {
    mocks.screens.mockReturnValue({ md: undefined });
    setWindowInnerWidth(1024);

    render(
      <MobileComponentsProvider>
        <div data-testid="content" />
      </MobileComponentsProvider>,
    );

    expect(screen.queryByTestId('schema-component-options')).not.toBeInTheDocument();
  });
});

describe('mobileComponents', () => {
  beforeEach(() => {
    mocks.designable.mockReturnValue(false);
  });

  it('uses the mobile picker for Select fields outside design mode', () => {
    const SelectComponent = mobileComponents.Select;

    render(<SelectComponent />);

    expect(screen.getByTestId('mobile-picker')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-select')).not.toBeInTheDocument();
  });

  it('keeps the desktop Select in design mode', () => {
    mocks.designable.mockReturnValue(true);
    const SelectComponent = mobileComponents.Select;

    render(<SelectComponent />);

    expect(screen.getByTestId('desktop-select')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-picker')).not.toBeInTheDocument();
  });
});
