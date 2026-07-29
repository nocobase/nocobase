/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type LegacyWorkflowLocation = {
  pathname: string;
  search: string;
  hash: string;
};

export function buildLegacyWorkflowSettingsTarget(rootPublicPath: string, location: LegacyWorkflowLocation) {
  const root = rootPublicPath.replace(/\/+$/, '');
  const appScope = /\/(?:apps|_app)\/[^/]+(?=\/admin\/workflow(?:\/|$))/.exec(location.pathname)?.[0] || '';
  const routePath = location.pathname.replace(/^.*?\/admin\/workflow(?=\/|$)/, '/settings/workflow');
  const scopedRoutePath = routePath.replace(/^\/settings(?=\/|$)/, '');
  const documentPath = appScope ? `/settings${appScope}${scopedRoutePath}` : routePath;

  return `${root}${documentPath}${location.search}${location.hash}`;
}
