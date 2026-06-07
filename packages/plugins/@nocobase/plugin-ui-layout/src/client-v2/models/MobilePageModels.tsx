/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowSettingsButton } from '@nocobase/flow-engine';
import React from 'react';
import { MobileBackButton, MobilePageSurface } from './mobileComponents';

type RouteWithTabs = {
  id?: string | number | null;
  menuSchemaUid?: string | null;
  pageSchemaUid?: string | null;
  schemaUid?: string | null;
  enableTabs?: boolean;
};

type PageTabRoute = RouteWithTabs & {
  uiLayouts?: string[];
};

type PageTabCreateModelOptions = ReturnType<RootPageModel['createPageTabModelOptions']>;
type PageTabCreateModelOptionsProps = NonNullable<PageTabCreateModelOptions['props']> & {
  route?: PageTabRoute;
};
type LayoutWithUid = {
  uid?: unknown;
};

function getCurrentUiLayoutUid(model: RootPageModel | ChildPageModel) {
  const uid = (model.context.layout as LayoutWithUid | undefined)?.uid;
  return typeof uid === 'string' && uid.trim() ? uid : undefined;
}

function withCurrentUiLayout(
  model: RootPageModel | ChildPageModel,
  options: PageTabCreateModelOptions,
): PageTabCreateModelOptions {
  const layoutUid = getCurrentUiLayoutUid(model);
  if (!layoutUid) {
    return options;
  }

  const props = (options.props || {}) as PageTabCreateModelOptionsProps;

  return {
    ...options,
    props: {
      ...props,
      route: {
        ...(props.route || {}),
        uiLayouts: [layoutUid],
      },
    },
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

function renderMobilePageTabLeftSpacer() {
  return <span aria-hidden="true" className="nb-ui-layout-mobile-page-tab-left-spacer" />;
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
  private readonly createDefaultPageTabModelOptions = this.createPageTabModelOptions;

  createPageTabModelOptions = () => withCurrentUiLayout(this, this.createDefaultPageTabModelOptions());

  tabBarExtraContent = {
    left: renderMobilePageTabLeftSpacer(),
    right: renderMobileAddTabButton(this),
  };

  async saveStepParams() {
    await super.saveStepParams();
    syncRootEnableTabsAfterSave(this);
  }

  render() {
    const displayTitle = !!this.props.displayTitle && !!this.props.title;
    const enableTabs = resolveRootEnableTabs(this);

    return (
      <MobilePageSurface title={this.props.title} displayTitle={displayTitle}>
        {enableTabs ? renderMobileTabs(this.renderTabs()) : renderMobileBody(this.renderFirstTab())}
      </MobilePageSurface>
    );
  }
}

export class MobileChildPageModel extends ChildPageModel {
  private readonly createDefaultPageTabModelOptions = this.createPageTabModelOptions;

  createPageTabModelOptions = () => withCurrentUiLayout(this, this.createDefaultPageTabModelOptions());

  tabBarExtraContent = {
    left: <MobileBackButton />,
    right: renderMobileAddTabButton(this),
  };

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
    );
  }
}
