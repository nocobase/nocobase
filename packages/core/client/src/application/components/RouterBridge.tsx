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
import { useLocation, useParams } from 'react-router-dom';
import { Application } from '../Application';

export function useRouterSync(app: Application) {
  const params = useParams();
  const location = useLocation();
  const engine = app.flowEngine;
  console.log('useRouterSync', params, location);
  useEffect(() => {
    engine.context.route.params = params;
  }, [engine.context, params]);
  useEffect(() => {
    engine.context['_observableCache']['location'] = location;
  }, [engine.context, location]);
}

export function RouterBridge({ app }) {
  useRouterSync(app);
  return null;
}
