/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RootPageModel } from '@nocobase/client-v2';
import type { FlowModel } from '@nocobase/flow-engine';
import copy from 'copy-to-clipboard';
import { NAMESPACE } from './locale';
import { getEmbedRoutePath } from './route';

const COPY_EMBED_LINK_KEY = 'embed.copyEmbeddedLink';

let registered = false;

function translate(model: FlowModel, fallbackT: (key: string, options?: any) => string, key: string) {
  return (model.context as any).i18n?.t?.(key, { ns: NAMESPACE }) || fallbackT(key);
}

function getRoutePageUid(model: FlowModel) {
  const currentRoute = (model.context as any).currentRoute;
  return model.parentId || currentRoute?.schemaUid || currentRoute?.uid || currentRoute?.id || model.uid;
}

export function buildEmbedLink(model: FlowModel) {
  const pageUid = getRoutePageUid(model);
  const app = (model.context as any).app;
  const pathname = getEmbedRoutePath(app, `/embed/${pageUid}`);
  return new URL(pathname, window.location.origin).toString();
}

export function registerCopyEmbedLinkFlow() {
  if (registered) {
    return;
  }

  registered = true;
  RootPageModel.registerExtraMenuItems({
    keyPrefix: COPY_EMBED_LINK_KEY,
    group: 'common-actions',
    sort: -100,
    matcher: (model) => !!getRoutePageUid(model),
    items: (model, t) => [
      {
        key: COPY_EMBED_LINK_KEY,
        label: translate(model, t, 'Copy embedded link'),
        onClick: () => {
          const ok = copy(buildEmbedLink(model));
          const message = (model.context as any).message;
          if (ok) {
            message?.success?.(translate(model, t, 'Copy successful'));
            return;
          }
          message?.error?.(translate(model, t, 'Copy Failed'));
        },
      },
    ],
  });
}
