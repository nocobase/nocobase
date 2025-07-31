/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { useEffect, useMemo } from 'react';
import { useLocation, useMatch, useMatches, useParams } from 'react-router-dom';
import { Application } from '../Application';

export function useRouterSync(app: Application) {
  const params = useParams();
  const location = useLocation();
  const matches = useMatches();
  const engine = app.flowEngine;
  useEffect(() => {
    engine.context.route.params = params;
    const last = matches[matches.length - 1];
    if (!last) {
      return;
    }
    engine.context.route.id = last.id;
    engine.context.route.pathname = last.pathname;
    if (last.handle?.['path']) {
      engine.context.route.path = last.handle['path'];
    }
  }, [engine.context, params, matches]);
  useEffect(() => {
    engine.context['_observableCache']['location'] = location;
  }, [engine.context, location]);
}

export function RouterBridge({ app }) {
  useRouterSync(app);
  return null;
}
