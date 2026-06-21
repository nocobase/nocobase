/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useLocation, useMatches, useParams } from 'react-router-dom';
import { Application } from '../Application';

type LayoutMatchLike = {
  id: string;
  pathname: string;
};

type LayoutDefinitionLike = {
  routeName: string;
};

export function findDeepestLayoutMatch(layouts: LayoutDefinitionLike[] = [], matches: LayoutMatchLike[] = []) {
  const layoutRouteNames = new Set(layouts.map((layout) => layout.routeName));

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index];
    if (layoutRouteNames.has(match.id)) {
      return match;
    }
  }

  return null;
}

export function useRouterSync(app: Application) {
  const params = useParams();
  const location = useLocation();
  const matches = useMatches();
  const engine = app.flowEngine;
  useEffect(() => {
    const last = matches[matches.length - 1];
    if (!last) return;
    const layoutMatch = findDeepestLayoutMatch(app.layoutManager?.listLayouts?.(), matches);
    engine.context['_observableCache']['route'] = {
      name: last.id,
      pathname: last.pathname,
      path: last.handle?.['path'] || null,
      params,
      layoutRouteName: layoutMatch?.id,
      layoutBasePathname: layoutMatch?.pathname,
    };
  }, [app, engine.context, params, matches]);
  useEffect(() => {
    engine.context['_observableCache']['location'] = location;
  }, [engine.context, location]);
}

export function RouterBridge({ app }) {
  useRouterSync(app);
  return null;
}
