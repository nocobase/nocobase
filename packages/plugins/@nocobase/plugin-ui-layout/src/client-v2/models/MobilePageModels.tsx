/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import React from 'react';
import { MobileBackButton, MobilePageSurface } from './mobileComponents';

type RouteWithTabs = {
  id?: string | number | null;
  menuSchemaUid?: string | null;
  pageSchemaUid?: string | null;
  schemaUid?: string | null;
  enableTabs?: boolean;
};

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

function renderMobileTabs(children: React.ReactNode) {
  return <div className="nb-ui-layout-mobile-tabs">{children}</div>;
}

function renderMobileBody(children: React.ReactNode) {
  return <div className="nb-ui-layout-mobile-body">{children}</div>;
}

export class MobileRootPageModel extends RootPageModel {
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
  tabBarExtraContent = {
    left: <MobileBackButton />,
  };

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
    return (
      <MobilePageSurface>
        {this.props.enableTabs ? (
          renderMobileTabs(this.renderTabs())
        ) : (
          <>
            {this.renderBackButtonWhenTabsDisabled()}
            {renderMobileBody(this.renderFirstTab())}
          </>
        )}
      </MobilePageSurface>
    );
  }
}
