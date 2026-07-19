/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  deleteLightExtensionClientApp,
  listLightExtensionClientApps,
  type LightExtensionClientAppDescriptor,
  uploadLightExtensionClientApp,
} from '../api/lightExtensionClientAppsRequests';

interface LightExtensionClientAppHookErrorOptions {
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionClientAppHookError extends Error {
  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionClientAppHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionClientAppHookError';
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseLightExtensionClientAppsResult {
  list(repoId: string): Promise<LightExtensionClientAppDescriptor[]>;
  upload(repoId: string, file: File, expectedEntryId?: string): Promise<LightExtensionClientAppDescriptor>;
  delete(entryId: string): Promise<void>;
}

type FlowContextWithApi = {
  api: ApiClientLike;
};

export function useLightExtensionClientApps(): UseLightExtensionClientAppsResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);
  const fallbackMessage = t('Light extension application request failed');

  const request = useCallback(
    async <T>(run: () => Promise<T>) => {
      try {
        return await run();
      } catch (error) {
        throw normalizeClientAppError(error, fallbackMessage);
      }
    },
    [fallbackMessage],
  );
  return useMemo(
    () => ({
      list: (repoId: string) => request(() => listLightExtensionClientApps(ctx.api, repoId)),
      upload: (repoId: string, file: File, expectedEntryId?: string) =>
        request(() => uploadLightExtensionClientApp(ctx.api, repoId, file, expectedEntryId)),
      delete: (entryId: string) => request(() => deleteLightExtensionClientApp(ctx.api, entryId)),
    }),
    [ctx.api, request],
  );
}

function normalizeClientAppError(error: unknown, fallbackMessage: string): LightExtensionClientAppHookError {
  const response = getRecordProperty(error, 'response');
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  return new LightExtensionClientAppHookError({
    code: toNonEmptyString(serverError?.code),
    status: toNumber(serverError?.status) ?? toNumber(response?.status),
    message: toNonEmptyString(serverError?.message) || fallbackMessage,
    details: toRecord(serverError?.details) || undefined,
  });
}

function getFirstServerError(value: unknown): Record<string, unknown> | null {
  const record = toRecord(value);
  if (!record) {
    return null;
  }
  if (Array.isArray(record.errors)) {
    return record.errors.map(toRecord).find((item): item is Record<string, unknown> => Boolean(item)) || null;
  }
  return toRecord(record.error);
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | null {
  return toRecord(toRecord(value)?.[key]);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
