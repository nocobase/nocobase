/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { MultiPortalRuntimeRecord } from './layoutRegistration';

export const PORTAL_ACCESS_DENIED_CODE = 'PORTAL_ACCESS_DENIED';

export type PortalRoleMode = 'default' | 'allow-use-union' | 'only-use-union' | string;

export type PortalAccessDeniedContext = {
  portalName: string;
  role?: string;
  roles?: string[];
  roleMode?: PortalRoleMode;
  allowAnonymous?: boolean;
};

export type PortalAccessState = {
  status: 'checking' | 'allowed' | 'denied' | 'error';
  portalName: string;
  role?: string;
  requestedRole?: string;
  generation: number;
  denied?: PortalAccessDeniedContext;
};

type PortalAccessAuth = {
  role?: string | null;
  setRole: (role: string | null) => void;
};

export type PortalAccessApiClient = {
  axios: AxiosInstance;
  auth: PortalAccessAuth;
  request: (config: AxiosRequestConfig) => Promise<AxiosResponse<unknown>>;
  resource: (name: string) => unknown;
};

type PortalAccessControllerOptions = {
  apiClient: PortalAccessApiClient;
  getCurrentPathname: () => string;
  getBasename?: () => string | undefined;
};

type PortalRequestMeta = {
  generation: number;
  portalName: string;
  requestedRole?: string;
};

type PortalAxiosConfig = AxiosRequestConfig & {
  __multiPortalAccess?: PortalRequestMeta;
};

type ErrorLike = {
  config?: PortalAxiosConfig;
  response?: {
    config?: PortalAxiosConfig;
    data?: unknown;
    status?: number;
  };
  status?: number;
};

type PortalErrorBody = {
  data?: unknown;
  errors?: unknown;
};

const GLOBAL_ROUTE_SEGMENTS = new Set(['admin', 'forgot-password', 'reset-password', 'settings', 'signin', 'signup']);

function normalizeRole(role: unknown) {
  return typeof role === 'string' && role.trim() ? role.trim() : undefined;
}

function normalizePathname(pathname: string) {
  const pathOnly = pathname.split(/[?#]/, 1)[0] || '/';
  const normalized = `/${pathOnly.replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? normalized : normalized.replace(/\/+$/g, '');
}

function removeBasename(pathname: string, basename?: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedBasename = normalizePathname(basename || '/');
  if (normalizedBasename === '/') {
    return normalizedPathname;
  }
  if (normalizedPathname === normalizedBasename) {
    return '/';
  }
  if (normalizedPathname.startsWith(`${normalizedBasename}/`)) {
    return normalizePathname(normalizedPathname.slice(normalizedBasename.length));
  }
  return normalizedPathname;
}

function isSameOrChildPath(pathname: string, routePath: string) {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedRoutePath = normalizePathname(routePath);
  return normalizedPathname === normalizedRoutePath || normalizedPathname.startsWith(`${normalizedRoutePath}/`);
}

function isNoCodePortal(record: MultiPortalRuntimeRecord) {
  return record.enabled && (record.portalType || 'no-code') === 'no-code';
}

function isExternalRequest(url: unknown) {
  return typeof url === 'string' && /^(?:https?:)?\/\//i.test(url.trim());
}

function isRolesCheckRequest(url: unknown) {
  if (typeof url !== 'string') {
    return false;
  }
  const path = url.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  return path === 'roles:check';
}

function getResponseRole(data: unknown) {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const responseData = (data as { data?: unknown }).data;
  if (!responseData || typeof responseData !== 'object') {
    return undefined;
  }
  return normalizeRole((responseData as { role?: unknown }).role);
}

function getPortalDenial(error: ErrorLike, expectedPortalName: string): PortalAccessDeniedContext | undefined {
  const response = error.response;
  if (response?.status !== 403 || !response.data || typeof response.data !== 'object') {
    return undefined;
  }

  const body = response.data as PortalErrorBody;
  const errors = Array.isArray(body.errors) ? body.errors : [];
  const deniedError = errors.find(
    (item) => !!item && typeof item === 'object' && (item as { code?: unknown }).code === PORTAL_ACCESS_DENIED_CODE,
  );
  if (!deniedError || !body.data || typeof body.data !== 'object') {
    return undefined;
  }

  const data = body.data as Record<string, unknown>;
  if (data.portalName !== expectedPortalName) {
    return undefined;
  }

  return {
    portalName: expectedPortalName,
    role: normalizeRole(data.role),
    roles: Array.isArray(data.roles)
      ? data.roles.filter((role): role is string => typeof role === 'string')
      : undefined,
    roleMode: typeof data.roleMode === 'string' ? data.roleMode : undefined,
    allowAnonymous: typeof data.allowAnonymous === 'boolean' ? data.allowAnonymous : undefined,
  };
}

function getStateKey(portalName: string, role?: string) {
  return `${portalName}\u0000${role || ''}`;
}

export class PortalAccessController {
  private readonly apiClient: PortalAccessApiClient;
  private readonly getCurrentPathname: () => string;
  private readonly getBasename: () => string | undefined;
  private readonly recordsByUid = new Map<string, MultiPortalRuntimeRecord>();
  private records: MultiPortalRuntimeRecord[] = [];
  private recordsLoaded = false;
  private readonly generations = new Map<string, number>();
  private readonly states = new Map<string, PortalAccessState>();
  private readonly listeners = new Set<() => void>();
  private snapshot: PortalAccessState | null = null;
  private requestInterceptor?: number;
  private responseInterceptor?: number;

  constructor(options: PortalAccessControllerOptions) {
    this.apiClient = options.apiClient;
    this.getCurrentPathname = options.getCurrentPathname;
    this.getBasename = options.getBasename || (() => undefined);
  }

  setRecords(records: MultiPortalRuntimeRecord[]) {
    this.records = records.filter(isNoCodePortal);
    this.records.sort(
      (left, right) => normalizePathname(right.routePath).length - normalizePathname(left.routePath).length,
    );
    this.recordsByUid.clear();
    for (const record of this.records) {
      this.recordsByUid.set(record.uid, record);
    }
    this.recordsLoaded = true;
    this.emit();
  }

  getPortalByUid(uid: string) {
    return this.recordsByUid.get(uid);
  }

  resolvePortal(pathname = this.getCurrentPathname()) {
    const relativePathname = removeBasename(pathname, this.getBasename());
    const record = this.records.find((candidate) => isSameOrChildPath(relativePathname, candidate.routePath));
    if (record || this.recordsLoaded) {
      return record;
    }

    const [candidate] = relativePathname.replace(/^\/+/, '').split('/');
    if (!candidate || GLOBAL_ROUTE_SEGMENTS.has(candidate) || !/^[a-z0-9][a-z0-9_-]*$/.test(candidate)) {
      return undefined;
    }

    return {
      uid: candidate,
      portalName: candidate,
      routePath: `/${candidate}`,
      authCheck: true,
      enabled: true,
      portalType: 'no-code',
    } satisfies MultiPortalRuntimeRecord;
  }

  install() {
    if (this.requestInterceptor !== undefined || this.responseInterceptor !== undefined) {
      return;
    }

    this.requestInterceptor = this.apiClient.axios.interceptors.request.use((config) => {
      const portal = isExternalRequest(config.url) ? undefined : this.resolvePortal();
      const headers = AxiosHeaders.from(config.headers);
      if (portal) {
        headers.set('X-Portal', portal.portalName);
      } else {
        headers.delete('X-Portal');
      }
      config.headers = headers;

      if (portal?.authCheck !== false && isRolesCheckRequest(config.url)) {
        const requestedRole = normalizeRole(this.apiClient.auth.role);
        const key = getStateKey(portal.portalName, requestedRole);
        const generation = (this.generations.get(key) || 0) + 1;
        const meta = { generation, portalName: portal.portalName, requestedRole };
        this.generations.set(key, generation);
        (config as PortalAxiosConfig).__multiPortalAccess = meta;
        this.setState(key, {
          generation,
          portalName: portal.portalName,
          requestedRole,
          role: requestedRole,
          status: 'checking',
        });
      }

      return config;
    });

    this.responseInterceptor = this.apiClient.axios.interceptors.response.use(
      (response) => {
        const meta = (response.config as PortalAxiosConfig).__multiPortalAccess;
        if (meta && this.isLatest(meta)) {
          const role = getResponseRole(response.data) || meta.requestedRole;
          const state: PortalAccessState = {
            generation: meta.generation,
            portalName: meta.portalName,
            requestedRole: meta.requestedRole,
            role,
            status: 'allowed',
          };
          this.setResolvedState(meta, state);
        }
        return response;
      },
      (error: unknown) => {
        const errorLike = error as ErrorLike;
        const meta = errorLike.response?.config?.__multiPortalAccess || errorLike.config?.__multiPortalAccess;
        if (meta && this.isLatest(meta)) {
          const denied = getPortalDenial(errorLike, meta.portalName);
          const state: PortalAccessState = denied
            ? {
                denied,
                generation: meta.generation,
                portalName: meta.portalName,
                requestedRole: meta.requestedRole,
                role: denied.role || meta.requestedRole,
                status: 'denied',
              }
            : {
                generation: meta.generation,
                portalName: meta.portalName,
                requestedRole: meta.requestedRole,
                role: meta.requestedRole,
                status: 'error',
              };
          this.setResolvedState(meta, state);
        }
        return Promise.reject(error);
      },
    );
  }

  dispose() {
    if (this.requestInterceptor !== undefined) {
      this.apiClient.axios.interceptors.request.eject(this.requestInterceptor);
      this.requestInterceptor = undefined;
    }
    if (this.responseInterceptor !== undefined) {
      this.apiClient.axios.interceptors.response.eject(this.responseInterceptor);
      this.responseInterceptor = undefined;
    }
  }

  getAccessState(portalName: string, role?: string | null): PortalAccessState {
    const normalizedRole = normalizeRole(role);
    const exact = this.states.get(getStateKey(portalName, normalizedRole));
    if (exact) {
      return exact;
    }
    if (
      this.snapshot?.portalName === portalName &&
      (!this.snapshot.requestedRole || this.snapshot.role === normalizedRole)
    ) {
      return this.snapshot;
    }
    return {
      generation: 0,
      portalName,
      requestedRole: normalizedRole,
      role: normalizedRole,
      status: 'checking',
    };
  }

  needsCheck(portalName: string, role?: string | null) {
    const normalizedRole = normalizeRole(role);
    if (this.states.has(getStateKey(portalName, normalizedRole))) {
      return false;
    }
    return !(
      this.snapshot?.portalName === portalName &&
      (!this.snapshot.requestedRole || this.snapshot.role === normalizedRole)
    );
  }

  invalidate(portalName: string, role?: string | null) {
    const normalizedRole = normalizeRole(role);
    const key = getStateKey(portalName, normalizedRole);
    const generation = (this.generations.get(key) || 0) + 1;
    this.generations.set(key, generation);
    const state: PortalAccessState = {
      generation,
      portalName,
      requestedRole: normalizedRole,
      role: normalizedRole,
      status: 'checking',
    };
    this.states.set(key, state);
    this.snapshot = state;
    this.emit();
  }

  checkAccess() {
    return this.apiClient.request({
      url: 'roles:check',
      skipAuth: true,
      skipNotify: true,
    } as AxiosRequestConfig);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private isLatest(meta: PortalRequestMeta) {
    return this.generations.get(getStateKey(meta.portalName, meta.requestedRole)) === meta.generation;
  }

  private setResolvedState(meta: PortalRequestMeta, state: PortalAccessState) {
    this.states.set(getStateKey(meta.portalName, meta.requestedRole), state);
    if (state.role && state.role !== meta.requestedRole) {
      this.states.set(getStateKey(meta.portalName, state.role), state);
    }
    if (this.resolvePortal()?.portalName === meta.portalName) {
      this.snapshot = state;
    }
    this.emit();
  }

  private setState(key: string, state: PortalAccessState) {
    this.states.set(key, state);
    if (this.resolvePortal()?.portalName === state.portalName) {
      this.snapshot = state;
    }
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
