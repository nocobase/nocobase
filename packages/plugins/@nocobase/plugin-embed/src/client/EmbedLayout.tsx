/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { useFieldSchema } from '@formily/react';
import {
  AdminProvider,
  CurrentPageUidContext,
  CurrentRouteProvider,
  findRouteBySchemaUid,
  KeepAlive,
  LayoutContent,
  NocoBaseDesktopRouteType,
  RemoteSchemaComponent,
  useAllAccessDesktopRoutes,
  useCurrentPageUid,
  useCurrentUserContext,
} from '@nocobase/client';
import { FlowRoute, type LayoutDefinition } from '@nocobase/client-v2';
import { FlowModelRenderer, useFlowEngine } from '@nocobase/flow-engine';
import { App, Layout, Result } from 'antd';
import copy from 'copy-to-clipboard';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { EMBED_LAYOUT_MODEL_CLASS, EMBED_LAYOUT_MODEL_UID } from '../client-v2/constants';
import { EmbedLayoutModelV2, getEmbedLayoutModel } from '../client-v2/EmbedLayoutModel';
import { isEmbedUnauthorizedUser } from './embedAuth';
// @ts-ignore
import pkg from './../../package.json';

const EMBED_LAYOUT_DEFINITION: LayoutDefinition = {
  routeName: 'embed',
  rootRouteName: 'embed',
  routePath: '/embed',
  uid: EMBED_LAYOUT_MODEL_UID,
  layoutModelClass: EMBED_LAYOUT_MODEL_CLASS,
  rootPageModelClass: 'RootPageModel',
  childPageModelClass: 'ChildPageModel',
  authCheck: true,
};

const getRefCurrent = <T,>(ref: React.MutableRefObject<T>) => ref.current;

export const EmbedAdminLayout = () => {
  return (
    // @ts-ignore
    <Layout style={{ height: '100%', '--nb-header-height': '0px' }}>
      <LayoutContent />
    </Layout>
  );
};

export const EmbedLayout = () => {
  const result = useCurrentUserContext();
  const user = result.data?.data;
  const noUser = result.loading === false && (!user?.id || isEmbedUnauthorizedUser(user));
  if (noUser) {
    return <NotAuthorized />;
  }
  return (
    <AdminProvider>
      <EmbedAdminLayout />
    </AdminProvider>
  );
};

function EmbedFlowPage(props: { pageUid: string }) {
  const { pageUid } = props;
  const flowEngine = useFlowEngine();
  const location = useLocation();
  const params = useParams();
  const { name, tabUid } = params;
  const viewPath = params['*'];
  const syncVersionRef = useRef(0);
  const model = getEmbedLayoutModel<EmbedLayoutModelV2>(flowEngine, {
    create: true,
    props: {
      layout: EMBED_LAYOUT_DEFINITION,
    },
    use: EmbedLayoutModelV2,
  });
  if (!model) {
    throw new Error('[NocoBase] Cannot create embed layout model for flow page.');
  }

  const routeParams = useMemo(
    () => ({ name, tabUid, '*': viewPath }) as Record<string, string | undefined>,
    [name, tabUid, viewPath],
  );
  const routeLike = useMemo(
    () => ({
      id: tabUid ? 'embed.page.tab' : 'embed.page',
      name: tabUid ? 'embed.page.tab' : 'embed.page',
      pathname: location.pathname,
      params: routeParams,
      layoutRouteName: EMBED_LAYOUT_DEFINITION.routeName,
      layoutBasePathname: EMBED_LAYOUT_DEFINITION.routePath,
    }),
    [location.pathname, routeParams, tabUid],
  );
  const layoutRoute = model.resolveLayoutRoute(routeLike);
  const getCurrentLayoutModel = useCallback(() => model, [model]);
  const content =
    layoutRoute.type === 'page' ? (
      <FlowRoute
        pageUid={layoutRoute.pageUid || pageUid}
        active
        getLayoutModel={getCurrentLayoutModel}
        legacyPageBehavior="notFound"
      />
    ) : (
      <Result status="404" title="404" />
    );

  model.setProps({
    layout: EMBED_LAYOUT_DEFINITION,
    children: content,
  });

  useEffect(() => {
    const syncVersion = ++syncVersionRef.current;
    model.syncLayoutRoute(routeLike);
    return () => {
      Promise.resolve()
        .then(() => {
          if (getRefCurrent(syncVersionRef) !== syncVersion) {
            return;
          }
          model.clearLayoutRoute(routeLike);
          model.setProps({ children: undefined });
        })
        .catch(() => {
          // ignore
        });
    };
  }, [model, routeLike]);

  return <FlowModelRenderer model={model} />;
}

export function EmbedPage() {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const currentRoute = useMemo(
    () => findRouteBySchemaUid(currentPageUid, allAccessRoutes),
    [allAccessRoutes, currentPageUid],
  );

  if (currentRoute?.type === NocoBaseDesktopRouteType.flowPage) {
    return <EmbedFlowPage pageUid={currentPageUid} />;
  }

  return (
    <KeepAlive uid={currentPageUid}>
      {(uid) => (
        <CurrentPageUidContext.Provider value={uid}>
          <CurrentRouteProvider uid={uid}>
            <RemoteSchemaComponent uid={uid} />
          </CurrentRouteProvider>
        </CurrentPageUidContext.Provider>
      )}
    </KeepAlive>
  );
}

export function NotAuthorized() {
  const { t } = useEmbedTranslation();
  return <Result status="403" title="403" subTitle={t('Sorry, you are not authorized to access this page.')} />;
}

export function useEmbedTranslation() {
  return useTranslation(pkg.name, { nsMode: 'fallback' });
}

export function useBlockSettingProps() {
  const { name: pageUid } = useParams();
  const fieldSchema = useFieldSchema();
  const { message } = App.useApp();
  const { t } = useEmbedTranslation();
  return {
    title: t('Copy embedded link'),
    onClick: () => {
      const url = window.location.href
        .replace('/admin', '/embed')
        .replace(pageUid, fieldSchema['x-uid'])
        .replace(window.location.search || '', '');
      copy(url);
      message.success(t('Copy successful'));
    },
  };
}
