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
  listLightExtensionClientAppReferences,
  listLightExtensionClientApps,
  type LightExtensionClientAppDescriptor,
  type LightExtensionClientAppReference,
  uploadLightExtensionClientApp,
} from '../api/lightExtensionClientAppsRequests';

export type LightExtensionClientAppOperation = 'list' | 'upload' | 'delete' | 'references';

interface LightExtensionClientAppHookErrorOptions {
  operation: LightExtensionClientAppOperation;
  code?: string;
  status?: number;
  message: string;
  details?: Record<string, unknown>;
}

export class LightExtensionClientAppHookError extends Error {
  readonly operation: LightExtensionClientAppOperation;

  readonly code?: string;

  readonly status?: number;

  readonly details?: Record<string, unknown>;

  constructor(options: LightExtensionClientAppHookErrorOptions) {
    super(options.message);
    this.name = 'LightExtensionClientAppHookError';
    this.operation = options.operation;
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export interface UseLightExtensionClientAppsResult {
  list(repoId: string): Promise<LightExtensionClientAppDescriptor[]>;
  upload(
    repoId: string,
    file: File,
    expected?: { entryId: string; contentHash: string },
  ): Promise<LightExtensionClientAppDescriptor>;
  delete(entryId: string): Promise<void>;
  listReferences(entryId: string): Promise<LightExtensionClientAppReference[]>;
}

type FlowContextWithApi = {
  api: ApiClientLike;
};

export function useLightExtensionClientApps(): UseLightExtensionClientAppsResult {
  const ctx = useFlowContext() as FlowContextWithApi;
  const { t } = useTranslation(NAMESPACE);
  const fallbackMessage = t('Light extension application request failed');

  const list = useCallback(
    async (repoId: string) => {
      try {
        return await listLightExtensionClientApps(ctx.api, repoId);
      } catch (error) {
        throw normalizeClientAppError('list', error, fallbackMessage);
      }
    },
    [ctx.api, fallbackMessage],
  );
  const upload = useCallback(
    async (repoId: string, file: File, expected?: { entryId: string; contentHash: string }) => {
      try {
        return await uploadLightExtensionClientApp(ctx.api, repoId, file, expected);
      } catch (error) {
        throw normalizeClientAppError('upload', error, fallbackMessage);
      }
    },
    [ctx.api, fallbackMessage],
  );
  const deleteApp = useCallback(
    async (entryId: string) => {
      try {
        await deleteLightExtensionClientApp(ctx.api, entryId);
      } catch (error) {
        throw normalizeClientAppError('delete', error, fallbackMessage);
      }
    },
    [ctx.api, fallbackMessage],
  );
  const listReferences = useCallback(
    async (entryId: string) => {
      try {
        return await listLightExtensionClientAppReferences(ctx.api, entryId);
      } catch (error) {
        throw normalizeClientAppError('references', error, fallbackMessage);
      }
    },
    [ctx.api, fallbackMessage],
  );

  return useMemo(
    () => ({ list, upload, delete: deleteApp, listReferences }),
    [deleteApp, list, listReferences, upload],
  );
}

function normalizeClientAppError(
  operation: LightExtensionClientAppOperation,
  error: unknown,
  fallbackMessage: string,
): LightExtensionClientAppHookError {
  const response = getRecordProperty(error, 'response');
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  return new LightExtensionClientAppHookError({
    operation,
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
