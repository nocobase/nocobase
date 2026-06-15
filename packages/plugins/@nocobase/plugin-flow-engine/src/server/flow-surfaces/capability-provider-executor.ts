/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilitiesProvider } from './types';

export const FLOW_SURFACE_PROVIDER_TIMEOUT_MS = 3000;

const INTERNAL_PROVIDER_ERROR_TOKENS = new Set([
  'capabilityId',
  'modelUse',
  'use',
  'props',
  'decoratorProps',
  'stepParams',
  'flowRegistry',
  'resourceSettings',
  'tableSettings',
  'cardSettings',
  'buttonSettings',
  'formModelSettings',
  'eventSettings',
  'pageSettings',
  'pageTabSettings',
  'ganttSettings',
  'formSettings',
  'detailsSettings',
  'calendarSettings',
  'treeSettings',
  'kanbanSettings',
  'listSettings',
  'gridCardSettings',
  'markdownBlockSettings',
  'iframeBlockSettings',
  'chartSettings',
  'commentsSettings',
  'recordHistorySettings',
  'tableColumnSettings',
  'createModelOptions',
  'subModels',
  'defaultNode',
  'nodeTemplate',
  'lens',
  'implementation',
]);

export type FlowSurfaceProviderCallResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      reasonCode: 'provider-error';
      message: string;
    };

export async function callFlowSurfaceProvider<T>(input: {
  provider: FlowSurfaceCapabilitiesProvider;
  method: 'getCapabilities' | 'isAvailable' | 'resolveSettingsSchema' | 'validateSettings' | 'resolveCreate';
  run: (signal: AbortSignal) => Promise<T> | T;
  timeoutMs?: number;
}): Promise<FlowSurfaceProviderCallResult<T>> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutMs = input.timeoutMs ?? FLOW_SURFACE_PROVIDER_TIMEOUT_MS;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new Error(`provider ${input.method} timed out`));
      }, timeoutMs);
    });
    const value = await Promise.race([Promise.resolve(input.run(controller.signal)), timeoutPromise]);
    return {
      ok: true,
      value,
    };
  } catch (error) {
    return {
      ok: false,
      reasonCode: 'provider-error',
      message: sanitizeProviderErrorMessage(error, input.method),
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function sanitizeProviderErrorMessage(error: unknown, method: string) {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const firstLine = rawMessage.split('\n')[0]?.trim();
  if (firstLine === `provider ${method} timed out`) {
    return firstLine;
  }
  if (!firstLine || containsInternalProviderToken(firstLine)) {
    return `provider ${method} failed`;
  }
  return firstLine;
}

function containsInternalProviderToken(value: string) {
  return value
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .some((segment) => INTERNAL_PROVIDER_ERROR_TOKENS.has(segment) || /Model$/.test(segment));
}
