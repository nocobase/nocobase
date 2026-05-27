/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ApiClient = {
  request: (config: { url?: string; resource?: string; action?: string; method: string; params?: any }) => Promise<any>;
};

let apiClient: ApiClient | null = null;

export function setApiClient(client: ApiClient) {
  apiClient = client;
}

export function getApiClient(): ApiClient | null {
  return apiClient;
}
