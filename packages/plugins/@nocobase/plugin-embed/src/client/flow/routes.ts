/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EmbedPage } from '../EmbedLayout';
import type { ComponentType } from 'react';

const Key = 'embed';
const UrlPrefix = `/${Key}`;

type RouterLike = {
  add: (name: string, route: { path: string; Component: ComponentType<any> }) => void;
};

export const registerEmbedFlowRoutes = (router: RouterLike) => {
  // v2 route patterns, aligned with admin routing.
  router.add(`${Key}.pageTabV2`, {
    path: `${UrlPrefix}/:name/tab/:tabUid`,
    Component: EmbedPage,
  });

  router.add(`${Key}.pageViewV2`, {
    path: `${UrlPrefix}/:name/view/*`,
    Component: EmbedPage,
  });

  router.add(`${Key}.pageTabViewV2`, {
    path: `${UrlPrefix}/:name/tab/:tabUid/view/*`,
    Component: EmbedPage,
  });
};
