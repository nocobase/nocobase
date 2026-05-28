/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PageModel } from '@nocobase/client';
import copy from 'copy-to-clipboard';
// @ts-ignore
import pkg from '../../../package.json';

type AppLike = {
  getRouteUrl: (name: string) => string;
  i18n: {
    t: (key: string, options?: Record<string, any>) => string;
  };
};

let registered = false;

const trimSlash = (value = '') => value.replace(/\/+$/, '');

const getCurrentEmbedPath = (app: AppLike, model: any) => {
  const embedPrefix = trimSlash(app.getRouteUrl('embed') || '/embed');
  const adminPrefix = trimSlash(app.getRouteUrl('admin') || '/admin');
  const pathname = window.location.pathname || '';

  // Keep current tab/view path in v2 by mapping /admin/... to /embed/...
  if (pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`)) {
    return `${embedPrefix}${pathname.slice(adminPrefix.length)}`;
  }

  // Fallback to explicit page schema uid when current path is not admin-based.
  const pageSchemaUid =
    model?.context?.currentRoute?.schemaUid || model?.props?.route?.schemaUid || model?.parentId || model?.uid;
  return `${embedPrefix}/${pageSchemaUid}`;
};

export const registerEmbedFlowMenuExtensions = (app: AppLike) => {
  if (registered) {
    return;
  }
  registered = true;

  PageModel.registerExtraMenuItems({
    group: 'common-actions',
    sort: -9,
    items: (model) => {
      const t = (key: string) => app.i18n.t(key, { ns: pkg.name, nsMode: 'fallback' });
      return [
        {
          key: 'embed-copy-link',
          label: t('Copy embedded link'),
          onClick: () => {
            const embedPath = getCurrentEmbedPath(app, model);
            const url = `${window.location.origin}${embedPath}`;
            copy(url);
            model.context.message?.success?.(t('Copy successful'));
          },
        },
      ];
    },
  });
};
