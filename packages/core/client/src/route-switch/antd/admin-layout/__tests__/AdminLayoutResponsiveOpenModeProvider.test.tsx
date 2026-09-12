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
import { OpenModeProvider, useOpenModeContext } from '../../../../modules/popup/OpenModeProvider';
import {
  AllPopupsPropsProviderContext,
  PopupParamsProviderContext,
} from '../../../../schema-component/antd/page/PagePopups';
import { PopupSettingsProvider } from '../../../../schema-component/antd/page/PopupSettingsProvider';
import { AdminLayoutResponsiveOpenModeProvider } from '../AdminLayoutResponsiveOpenModeProvider';

vi.mock('../../../../schema-component/antd/action/Action.Drawer', () => ({
  ActionDrawer: () => <div data-testid="action-drawer" />,
  default: () => <div data-testid="action-drawer" />,
}));

vi.mock('../../../../schema-component/antd/action/Action.Modal', () => ({
  ActionModal: () => <div data-testid="action-modal" />,
  default: () => <div data-testid="action-modal" />,
}));

vi.mock('../../../../schema-component/antd/action/Action.Page', () => ({
  ActionPage: () => <div data-testid="action-page" />,
  default: () => <div data-testid="action-page" />,
}));

const OpenModeProbe = ({ level = 1 }: { level?: number }) => {
  const { defaultOpenMode, getComponentByOpenMode, isMobile } = useOpenModeContext();
  const DefaultComponent = getComponentByOpenMode(defaultOpenMode);
  const DrawerComponent = getComponentByOpenMode('drawer');
  const ModalComponent = getComponentByOpenMode('modal');

  return (
    <>
      <div data-testid="default-open-mode">{defaultOpenMode}</div>
      <div data-testid="is-mobile-open-mode">{isMobile ? 'mobile' : 'not-mobile'}</div>
      <DefaultComponent level={level} />
      <DrawerComponent level={level} />
      <ModalComponent level={level} />
    </>
  );
};

const UrlPopupContextProvider = ({ children }: { children: React.ReactNode }) => (
  <AllPopupsPropsProviderContext.Provider
    value={[
      {
        params: {
          popupuid: '70iob7ialv1',
          filterbytk: '1',
        },
        context: null,
        currentLevel: 1,
        hidden: false,
      },
    ]}
  >
    <PopupParamsProviderContext.Provider
      value={{
        params: {
          popupuid: '70iob7ialv1',
          filterbytk: '1',
        },
        context: null,
        currentLevel: 1,
      }}
    >
      {children}
    </PopupParamsProviderContext.Provider>
  </AllPopupsPropsProviderContext.Provider>
);

describe('AdminLayoutResponsiveOpenModeProvider', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/admin/sgevn66i362/popups/70iob7ialv1/filterbytk/1');
  });

  it('renders URL-controlled drawer and modal popups as subpages in responsive admin layout', () => {
    render(
      <PopupSettingsProvider>
        <UrlPopupContextProvider>
          <AdminLayoutResponsiveOpenModeProvider responsive>
            <OpenModeProbe />
          </AdminLayoutResponsiveOpenModeProvider>
        </UrlPopupContextProvider>
      </PopupSettingsProvider>,
    );

    expect(screen.getByTestId('default-open-mode')).toHaveTextContent('drawer');
    expect(screen.getByTestId('is-mobile-open-mode')).toHaveTextContent('not-mobile');
    expect(screen.getAllByTestId('action-page')).toHaveLength(3);
    expect(screen.queryByTestId('action-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
  });

  it('keeps drawer and modal components when popup visibility is not controlled by URL', () => {
    render(
      <PopupSettingsProvider enableURL={false}>
        <AdminLayoutResponsiveOpenModeProvider responsive>
          <OpenModeProbe />
        </AdminLayoutResponsiveOpenModeProvider>
      </PopupSettingsProvider>,
    );

    expect(screen.getByTestId('default-open-mode')).toHaveTextContent('drawer');
    expect(screen.getByTestId('is-mobile-open-mode')).toHaveTextContent('not-mobile');
    expect(screen.getAllByTestId('action-drawer')).toHaveLength(2);
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('action-page')).not.toBeInTheDocument();
  });

  it('keeps drawer and modal components when URL popup support is enabled but the current popup is local', () => {
    render(
      <PopupSettingsProvider>
        <AdminLayoutResponsiveOpenModeProvider responsive>
          <OpenModeProbe />
        </AdminLayoutResponsiveOpenModeProvider>
      </PopupSettingsProvider>,
    );

    expect(screen.getByTestId('default-open-mode')).toHaveTextContent('drawer');
    expect(screen.getByTestId('is-mobile-open-mode')).toHaveTextContent('not-mobile');
    expect(screen.getAllByTestId('action-drawer')).toHaveLength(2);
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('action-page')).not.toBeInTheDocument();
  });

  it('keeps nested local popups inside URL subpages as drawer and modal components', () => {
    render(
      <PopupSettingsProvider>
        <UrlPopupContextProvider>
          <AdminLayoutResponsiveOpenModeProvider responsive>
            <OpenModeProbe level={2} />
          </AdminLayoutResponsiveOpenModeProvider>
        </UrlPopupContextProvider>
      </PopupSettingsProvider>,
    );

    expect(screen.getByTestId('default-open-mode')).toHaveTextContent('drawer');
    expect(screen.getAllByTestId('action-drawer')).toHaveLength(2);
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('action-page')).not.toBeInTheDocument();
  });

  it('preserves parent open mode components for responsive fallbacks', () => {
    const CustomDrawer = () => <div data-testid="custom-drawer" />;
    const CustomModal = () => <div data-testid="custom-modal" />;
    const CustomPage = () => <div data-testid="custom-page" />;

    render(
      <OpenModeProvider
        openModeToComponent={{
          drawer: CustomDrawer,
          modal: CustomModal,
          page: CustomPage,
        }}
      >
        <PopupSettingsProvider enableURL={false}>
          <AdminLayoutResponsiveOpenModeProvider responsive>
            <OpenModeProbe />
          </AdminLayoutResponsiveOpenModeProvider>
        </PopupSettingsProvider>
      </OpenModeProvider>,
    );

    expect(screen.getAllByTestId('custom-drawer')).toHaveLength(2);
    expect(screen.getByTestId('custom-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-modal')).not.toBeInTheDocument();
  });

  it('uses the parent page component for URL-controlled responsive popups', () => {
    const CustomDrawer = () => <div data-testid="custom-drawer" />;
    const CustomModal = () => <div data-testid="custom-modal" />;
    const CustomPage = () => <div data-testid="custom-page" />;

    render(
      <OpenModeProvider
        openModeToComponent={{
          drawer: CustomDrawer,
          modal: CustomModal,
          page: CustomPage,
        }}
      >
        <PopupSettingsProvider>
          <UrlPopupContextProvider>
            <AdminLayoutResponsiveOpenModeProvider responsive>
              <OpenModeProbe />
            </AdminLayoutResponsiveOpenModeProvider>
          </UrlPopupContextProvider>
        </PopupSettingsProvider>
      </OpenModeProvider>,
    );

    expect(screen.getAllByTestId('custom-page')).toHaveLength(3);
    expect(screen.queryByTestId('custom-drawer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('custom-modal')).not.toBeInTheDocument();
  });

  it('does not override open mode components outside responsive admin layout', () => {
    render(
      <OpenModeProvider>
        <PopupSettingsProvider>
          <AdminLayoutResponsiveOpenModeProvider responsive={false}>
            <OpenModeProbe />
          </AdminLayoutResponsiveOpenModeProvider>
        </PopupSettingsProvider>
      </OpenModeProvider>,
    );

    expect(screen.getByTestId('default-open-mode')).toHaveTextContent('drawer');
    expect(screen.getByTestId('is-mobile-open-mode')).toHaveTextContent('not-mobile');
    expect(screen.getAllByTestId('action-drawer')).toHaveLength(2);
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('action-page')).not.toBeInTheDocument();
  });
});
