/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface BuildRedirectPathOptions {
  /**
   * The app's root public path — i.e. `process.env.APP_PUBLIC_PATH`. May
   * arrive with or without a trailing slash; both are normalised.
   */
  appPublicPath?: string | null;
  /**
   * The sub-app path segment for the legacy (v1) routing scheme:
   * empty string for the main app, `/apps/<name>` when running a sub-app
   * under `AppSupervisor` `multiple` mode. Callers compute this from the
   * `__appName` request param + `AppSupervisor.runningMode`.
   */
  subAppSegment?: string | null;
  /**
   * The raw redirect the client supplied. May be:
   *  - v1 basename-relative (`/admin/abc`), needs full prefix prepended.
   *  - v2 root-relative (`/nocobase/v2/admin/abc` or
   *    `/nocobase/v2/apps/<id>/admin/abc`), already absolute under the
   *    document root; must NOT be touched.
   *  - missing — falls back to `/admin`.
   */
  target?: string | null;
}

/**
 * Build the final root-relative path that an SSO auth callback should
 * redirect the browser to.
 *
 * v1 clients emit `redirect` as a basename-relative path (`/admin/abc`)
 * and the server is expected to prepend `APP_PUBLIC_PATH` + the legacy
 * sub-app segment. v2 clients emit `redirect` as an already-root-relative
 * path that includes `APP_PUBLIC_PATH` and (for sub-apps) the
 * `/v2/apps/<id>` segment — so any further prepending produces nonsense
 * URLs like `/nocobase/apps/<id>/nocobase/v2/apps/<id>/admin/…`.
 *
 * Detection rule: a target is v2-shaped iff it starts with
 * `appPublicPath + '/'`. The sub-app segment is irrelevant to detection
 * because v2 always prefixes with `appPublicPath` regardless of sub-app
 * (`/<APP_PUBLIC_PATH>/v2/...` or `/<APP_PUBLIC_PATH>/v2/apps/<id>/...`).
 *
 * Single export shared by all auth-related SSO plugins (CAS, SAML, …).
 */
export function buildRedirectPath({ appPublicPath, subAppSegment, target }: BuildRedirectPathOptions): string {
  const normalizedAppPublicPath = (appPublicPath || '').replace(/\/+$/, '');
  const normalizedSubAppSegment = (subAppSegment || '').replace(/\/+$/, '');
  const resolvedTarget = target || '/admin';

  if (
    normalizedAppPublicPath &&
    (resolvedTarget === normalizedAppPublicPath || resolvedTarget.startsWith(normalizedAppPublicPath + '/'))
  ) {
    return resolvedTarget;
  }

  return `${normalizedAppPublicPath}${normalizedSubAppSegment}${resolvedTarget}`;
}
