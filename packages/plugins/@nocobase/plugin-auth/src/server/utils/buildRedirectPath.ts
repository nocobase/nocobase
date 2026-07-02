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
   *  - modern-client root-relative (`/nocobase/v/admin/abc` or
   *    `/nocobase/v/apps/<id>/admin/abc`), already absolute under the
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
 * sub-app segment. Modern (v2) clients emit `redirect` as an already-root-
 * relative path that includes `APP_PUBLIC_PATH` and (for sub-apps) the
 * `/<modern-prefix>/apps/<id>` segment — so any further prepending produces
 * nonsense URLs like `/nocobase/apps/<id>/nocobase/v/apps/<id>/admin/…`.
 *
 * Detection rule: a target is modern-shaped iff it starts with
 * `appPublicPath + '/'`. The sub-app segment is irrelevant to detection
 * because modern clients always prefix with `appPublicPath` regardless of
 * sub-app (`/<APP_PUBLIC_PATH>/v/...` or `/<…>/v/apps/<id>/...`).
 *
 * Single export shared by all auth-related SSO plugins (CAS, SAML, …).
 */
export function buildRedirectPath({ appPublicPath, subAppSegment, target }: BuildRedirectPathOptions): string {
  const normalizedAppPublicPath = (appPublicPath || '').replace(/\/+$/, '');
  const normalizedSubAppSegment = (subAppSegment || '').replace(/\/+$/, '');
  const resolvedTarget = target || '/admin';
  const [resolvedPathname] = resolvedTarget.split(/[?#]/, 1);

  if (
    normalizedAppPublicPath &&
    (resolvedTarget === normalizedAppPublicPath || resolvedTarget.startsWith(normalizedAppPublicPath + '/'))
  ) {
    return resolvedTarget;
  }

  const modernSubAppSegment = `/${getModernClientPrefix()}${normalizedSubAppSegment}`;
  if (
    normalizedSubAppSegment &&
    (resolvedPathname === normalizedSubAppSegment ||
      resolvedPathname.startsWith(`${normalizedSubAppSegment}/`) ||
      resolvedPathname === modernSubAppSegment ||
      resolvedPathname.startsWith(`${modernSubAppSegment}/`))
  ) {
    return resolvedTarget;
  }

  return `${normalizedAppPublicPath}${normalizedSubAppSegment}${resolvedTarget}`;
}

/**
 * The runtime URL segment under which the modern (v2) client is served,
 * read from `APP_MODERN_CLIENT_PREFIX` (default `v`). Returns a bare
 * segment without surrounding slashes.
 */
export function getModernClientPrefix(): string {
  return (
    String(process.env.APP_MODERN_CLIENT_PREFIX || '')
      .trim()
      .replace(/^\/+|\/+$/g, '') || 'v'
  );
}

export interface ResolveSigninPrefixOptions {
  /** `process.env.APP_PUBLIC_PATH`, with or without trailing slash. */
  appPublicPath?: string | null;
  /** The raw redirect target supplied by the client (RelayState / state / query). */
  redirect?: string | null;
  /** Legacy (v1) sub-app segment, e.g. `/apps/<name>` or empty. */
  subAppSegment?: string | null;
}

/**
 * On SSO failure the user must land back on the signin page of the *same*
 * shell they started from (legacy v1 vs modern v2). Modern-client URLs always
 * carry the `<APP_PUBLIC_PATH>/<modern-prefix>/` segment in the redirect;
 * legacy URLs never do. Returns the signin prefix to prepend to `/signin`.
 *
 * Shared by all SSO plugins (SAML, OIDC, CAS).
 */
export function resolveSigninPrefix({ appPublicPath, redirect, subAppSegment }: ResolveSigninPrefixOptions): string {
  const normalizedAppPublicPath = (appPublicPath || '').replace(/\/+$/, '');
  const modernSegment = `/${getModernClientPrefix()}`;
  const modernMarker = `${normalizedAppPublicPath}${modernSegment}`;
  const isModernOrigin =
    typeof redirect === 'string' && (redirect === modernMarker || redirect.startsWith(`${modernMarker}/`));
  return `${normalizedAppPublicPath}${isModernOrigin ? modernSegment : ''}${subAppSegment || ''}`;
}
