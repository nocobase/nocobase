export declare const DEFAULT_PORTAL_CACHE_TTL_MS = 1000;
export declare const DEFAULT_RESERVED_PORTAL_NAMES: readonly string[];
export declare const PORTAL_NAME_PATTERN: RegExp;

export interface PortalRequestMatch {
  portalName: string;
  portalRoot: string;
  distPath: string;
  indexPath: string;
  pathname: string;
  search: string;
  publicPath: string;
  relativePath: string;
}

export interface PortalRequestResolverOptions {
  cacheTtlMs?: number;
  getStorageRoot?: () => string;
  now?: () => number;
  reservedNames?: Iterable<string>;
}

export interface ResolvePortalRequestOptions {
  reservedNames?: Iterable<string>;
}

export declare function resolvePortalStorageRoot(): string;
export declare function normalizePortalPublicPath(value?: string): string;
export declare function getPortalReservedNames(env?: Readonly<Record<string, string | undefined>>): Set<string>;

export declare class PortalRequestResolver {
  constructor(options?: PortalRequestResolverOptions);
  clearCache(): void;
  resolve(requestUrl: string, appPublicPath?: string, options?: ResolvePortalRequestOptions): PortalRequestMatch | null;
}
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to https://www.nocobase.com/agreement.
 */
