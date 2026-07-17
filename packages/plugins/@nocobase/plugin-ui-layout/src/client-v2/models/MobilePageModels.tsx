/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { ChildPageModel, JSPageModel, RootPageModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowSettingsButton, type CreateModelOptions } from '@nocobase/flow-engine';
import { ConfigProvider } from 'antd';
import React from 'react';
import { MobileBackButton, MobilePageSurface } from './mobileComponents';
import {
  toMobileCompactThemeToken,
  useMobileCompactTheme,
  type MobileLayoutCompactThemeToken,
} from './mobileThemeToken';

type RouteWithTabs = {
  id?: string | number | null;
  menuSchemaUid?: string | null;
  pageSchemaUid?: string | null;
  schemaUid?: string | null;
  enableTabs?: boolean;
};

type RouteWithUiLayouts = Record<string, unknown> & {
  uiLayouts?: unknown;
};

function getCurrentLayoutUid(model: RootPageModel | ChildPageModel) {
  const layout = model.context?.layout as { uid?: unknown } | undefined;
  const layoutUid = layout?.uid;

  return typeof layoutUid === 'string' && layoutUid.trim() ? layoutUid : undefined;
}

function withCurrentLayoutRoute<T extends RouteWithUiLayouts>(model: RootPageModel | ChildPageModel, route: T) {
  const layoutUid = getCurrentLayoutUid(model);

  if (!layoutUid) {
    return route;
  }

  const existingUiLayouts = Array.isArray(route.uiLayouts)
    ? route.uiLayouts.filter((value): value is string => typeof value === 'string' && !!value)
    : [];

  return {
    ...route,
    uiLayouts: existingUiLayouts.includes(layoutUid) ? existingUiLayouts : [...existingUiLayouts, layoutUid],
  };
}

function routeMatchesRootPage(model: RootPageModel, currentRoute?: RouteWithTabs) {
  if (!currentRoute) {
    return false;
  }

  const routeId = model.props.routeId;
  if (routeId != null && currentRoute.id != null) {
    return String(currentRoute.id) === String(routeId);
  }

  const pageUid = model.parentId;
  if (!pageUid) {
    return false;
  }

  return [currentRoute.schemaUid, currentRoute.pageSchemaUid, currentRoute.menuSchemaUid].some(
    (routeUid) => routeUid != null && String(routeUid) === String(pageUid),
  );
}

function resolveRootEnableTabs(model: RootPageModel) {
  const currentRoute = model.context.currentRoute as RouteWithTabs | undefined;

  if (typeof currentRoute?.enableTabs === 'boolean' && routeMatchesRootPage(model, currentRoute)) {
    return currentRoute.enableTabs;
  }

  return !!model.props.enableTabs;
}

function getPendingRootEnableTabs(model: RootPageModel) {
  const enableTabs = model.stepParams.pageSettings?.general?.enableTabs;

  return typeof enableTabs === 'boolean' ? enableTabs : undefined;
}

function syncRootEnableTabsAfterSave(model: RootPageModel) {
  const enableTabs = getPendingRootEnableTabs(model);

  if (typeof enableTabs !== 'boolean') {
    return;
  }

  const currentRoute = model.context.currentRoute as RouteWithTabs | undefined;

  if (routeMatchesRootPage(model, currentRoute)) {
    currentRoute.enableTabs = enableTabs;
  }
  model.setProps({ ...model.props, enableTabs });
}

function renderMobileTabs(children: React.ReactNode) {
  return <div className="nb-ui-layout-mobile-tabs">{children}</div>;
}

function renderMobileBody(children: React.ReactNode) {
  return <div className="nb-ui-layout-mobile-body">{children}</div>;
}

function MobilePageCompactThemeProvider(props: { children: React.ReactNode }) {
  const mobileTheme = useMobileCompactTheme();

  return <ConfigProvider theme={mobileTheme}>{props.children}</ConfigProvider>;
}

function defineMobilePageRuntimeContext(model: RootPageModel | ChildPageModel) {
  model.context.defineProperty('isMobileLayout', {
    value: true,
  });
  model.context.defineProperty('themeToken', {
    get: () => toMobileCompactThemeToken(model.flowEngine.context.themeToken as MobileLayoutCompactThemeToken),
    cache: false,
  });
}

function renderMobilePageTabLeftSpacer() {
  return <span aria-hidden="true" className="nb-ui-layout-mobile-page-tab-left-spacer" />;
}

function renderMobileRootPageTabLeftSpacer() {
  return <span aria-hidden="true" className="nb-ui-layout-mobile-root-page-tab-left-spacer" />;
}

function renderMobileAddTabButton(model: RootPageModel | ChildPageModel) {
  const label = model.context.t('Add tab');

  return (
    <span className="nb-ui-layout-mobile-page-tab-add-wrapper">
      <AddSubModelButton
        model={model}
        subModelKey={'tabs'}
        items={[
          {
            key: 'blank',
            label,
            createModelOptions: model.createPageTabModelOptions,
          },
        ]}
      >
        <FlowSettingsButton aria-label={label} className="nb-ui-layout-mobile-page-tab-add" icon={<PlusOutlined />}>
          {null}
        </FlowSettingsButton>
      </AddSubModelButton>
    </span>
  );
}

export class MobileRootPageModel extends RootPageModel {
  createPageTabModelOptions = (): CreateModelOptions => {
    const modeId = uid();
    return {
      uid: modeId,
      use: 'RootPageTabModel',
      props: {
        route: withCurrentLayoutRoute(this, {
          parentId: this.props.routeId,
          type: 'tabs',
          schemaUid: modeId,
          tabSchemaName: uid(),
          params: [],
          hideInMenu: false,
          enableTabs: false,
        }),
      },
    };
  };

  tabBarExtraContent = {
    left: renderMobileRootPageTabLeftSpacer(),
    right: renderMobileAddTabButton(this),
  };

  constructor(options: ConstructorParameters<typeof RootPageModel>[0]) {
    super(options);
    defineMobilePageRuntimeContext(this);
  }

  async saveStepParams() {
    await super.saveStepParams();
    syncRootEnableTabsAfterSave(this);
  }

  render() {
    const displayTitle = !!this.props.displayTitle && !!this.props.title;
    const enableTabs = resolveRootEnableTabs(this);

    return (
      <MobilePageCompactThemeProvider>
        <MobilePageSurface title={this.props.title} displayTitle={displayTitle}>
          {enableTabs ? renderMobileTabs(this.renderTabs()) : renderMobileBody(this.renderFirstTab())}
        </MobilePageSurface>
      </MobilePageCompactThemeProvider>
    );
  }
}

export class MobileJSPageModel extends JSPageModel {
  constructor(options: ConstructorParameters<typeof JSPageModel>[0]) {
    super(options);
    defineMobilePageRuntimeContext(this);
  }

  private renderBackButton() {
    if (this.context?.view?.type !== 'embed' || this.props.displayTitle) {
      return null;
    }

    return (
      <div className="nb-ui-layout-mobile-titlebar">
        <MobileBackButton />
      </div>
    );
  }

  render() {
    const displayTitle = !!this.props.displayTitle && !!this.props.title;

    return (
      <MobilePageCompactThemeProvider>
        <MobilePageSurface
          title={this.props.title}
          displayTitle={displayTitle}
          titlebarLeft={displayTitle ? <MobileBackButton /> : null}
        >
          {this.renderBackButton()}
          {renderMobileBody(this.renderPageContent())}
        </MobilePageSurface>
      </MobilePageCompactThemeProvider>
    );
  }
}

export class MobileChildPageModel extends ChildPageModel {
  createPageTabModelOptions = (): CreateModelOptions => {
    const route = withCurrentLayoutRoute(this, {});
    return Object.keys(route).length > 0
      ? {
          use: 'ChildPageTabModel',
          props: {
            route,
          },
        }
      : {
          use: 'ChildPageTabModel',
        };
  };

  tabBarExtraContent = {
    left: <MobileBackButton />,
    right: renderMobileAddTabButton(this),
  };

  constructor(options: ConstructorParameters<typeof ChildPageModel>[0]) {
    super(options);
    defineMobilePageRuntimeContext(this);
  }

  private renderTabsWithTitlebarBackButton(displayTitle: boolean) {
    const leftExtraContent = this.tabBarExtraContent.left;

    this.tabBarExtraContent.left = displayTitle ? renderMobilePageTabLeftSpacer() : <MobileBackButton />;
    try {
      return this.renderTabs();
    } finally {
      this.tabBarExtraContent.left = leftExtraContent;
    }
  }

  renderBackButtonWhenTabsDisabled() {
    if (this.context?.view?.type !== 'embed') {
      return null;
    }

    return (
      <div className="nb-ui-layout-mobile-titlebar">
        <MobileBackButton />
      </div>
    );
  }

  render() {
    const displayTitle = !!this.props.displayTitle && !!this.props.title;

    return (
      <MobilePageCompactThemeProvider>
        <MobilePageSurface
          title={this.props.title}
          displayTitle={displayTitle}
          titlebarLeft={displayTitle ? <MobileBackButton /> : null}
        >
          {this.props.enableTabs ? (
            renderMobileTabs(this.renderTabsWithTitlebarBackButton(displayTitle))
          ) : (
            <>
              {displayTitle ? null : this.renderBackButtonWhenTabsDisabled()}
              {renderMobileBody(this.renderFirstTab())}
            </>
          )}
        </MobilePageSurface>
      </MobilePageCompactThemeProvider>
    );
  }
}
