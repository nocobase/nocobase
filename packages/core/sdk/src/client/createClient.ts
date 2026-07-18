/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AxiosRequestConfig } from 'axios';

import { APIClient } from '../APIClient';
import getSubAppName from '../getSubAppName';

export type ClientStorageType = 'localStorage' | 'sessionStorage' | 'memory';

export interface CreateClientOptions extends AxiosRequestConfig {
  /** Explicit application namespace. Defaults to the sub-application inferred from the deployment root, then `main`. */
  appName?: string;
  /** Deployment root used to infer a sub-application name. Defaults to `window.__nocobase_public_path__`, then `/`. */
  rootPublicPath?: string;
  /** Authentication state storage. Browser clients default to in-memory storage. */
  storageType?: ClientStorageType;
  storagePrefix?: string;
  shareToken?: boolean;
}

interface NocoBaseRuntimeWindow extends Window {
  __nocobase_api_base_url__?: string;
  __nocobase_public_path__?: string;
}

export function createClient(options: CreateClientOptions = {}): APIClient {
  const {
    appName,
    baseURL,
    rootPublicPath,
    shareToken,
    storagePrefix,
    storageType = 'memory',
    withCredentials = true,
    ...axiosOptions
  } = options;
  const runtimeWindow = getRuntimeWindow();
  const deploymentRoot = ensureTrailingSlash(rootPublicPath || runtimeWindow?.__nocobase_public_path__ || '/');
  const inferredAppName = getSubAppName(deploymentRoot) || 'main';
  const runtimeBaseURL = runtimeWindow?.__nocobase_api_base_url__?.trim();

  return new APIClient({
    ...axiosOptions,
    appName: appName || inferredAppName,
    baseURL: typeof baseURL === 'string' ? baseURL : runtimeBaseURL || '/api/',
    shareToken,
    storagePrefix,
    storageType,
    withCredentials,
  });
}

function getRuntimeWindow(): NocoBaseRuntimeWindow | undefined {
  return typeof window === 'undefined' ? undefined : (window as NocoBaseRuntimeWindow);
}

function ensureTrailingSlash(value: string): string {
  return `${value.replace(/\/+$/u, '') || ''}/`;
}
