/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { APIClient } from '@nocobase/client-v2';

// Reuse the client-v2 `APIClient` shape directly — the caller passes
// `this.app.apiClient` from `Plugin.load()`, which IS an `APIClient`
// instance. Keep the local `ApiClient` alias so call sites read naturally
// and the rest of this module isn't tied to the import path.
export type ApiClient = APIClient;

let apiClient: ApiClient | null = null;

export function setApiClient(client: ApiClient) {
  apiClient = client;
}

export function getApiClient(): ApiClient | null {
  return apiClient;
}
