/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ManagedAppRuntime } from './app-runtime.js';
import { printInfo, startTask, stopTask, updateTask } from './ui.js';

const APP_HEALTH_CHECK_INTERVAL_MS = 2_000;
const APP_HEALTH_CHECK_TIMEOUT_MS = 600_000;
const APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS = 5_000;

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function buildHealthCheckUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/__health_check`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAppHealthCheck(params: {
  healthCheckUrl: string;
  fetchImpl?: typeof fetch;
  requestTimeoutMs?: number;
}): Promise<{ ok: boolean; message: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, params.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS);

  try {
    const response = await (params.fetchImpl ?? fetch)(params.healthCheckUrl, {
      method: 'GET',
      signal: controller.signal,
    });
    const text = await response.text().catch(() => '');
    const body = text.replace(/\s+/g, ' ').trim() || 'No response yet';
    return {
      ok: response.ok && text.trim().toLowerCase() === 'ok',
      message: `HTTP ${response.status}: ${body}`,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        message: `No response within ${Math.ceil((params.requestTimeoutMs ?? APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS) / 1000)}s`,
      };
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export class AppHealthCheckError extends Error {}

export function formatAppUrl(port?: string): string | undefined {
  const value = trimValue(port);
  return value ? `http://127.0.0.1:${value}` : undefined;
}

export function resolveManagedAppApiBaseUrl(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: { portOverride?: string },
): string | undefined {
  const override = trimValue(options?.portOverride);
  if (override) {
    return `http://127.0.0.1:${override}/api`;
  }

  const baseUrl = trimValue(runtime.env.baseUrl);
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '');
  }

  const appPort =
    runtime.env.appPort === undefined || runtime.env.appPort === null
      ? ''
      : trimValue(runtime.env.appPort);
  return appPort ? `http://127.0.0.1:${appPort}/api` : undefined;
}

export async function isAppReady(
  apiBaseUrl?: string,
  options?: {
    fetchImpl?: typeof fetch;
    requestTimeoutMs?: number;
  },
): Promise<boolean> {
  const baseUrl = trimValue(apiBaseUrl);
  if (!baseUrl) {
    return false;
  }

  const result = await requestAppHealthCheck({
    healthCheckUrl: buildHealthCheckUrl(baseUrl),
    fetchImpl: options?.fetchImpl,
    requestTimeoutMs: options?.requestTimeoutMs,
  });
  return result.ok;
}

export async function waitForAppReady(params: {
  envName: string;
  apiBaseUrl?: string;
  containerName?: string;
  logHint?: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const apiBaseUrl = trimValue(params.apiBaseUrl);
  if (!apiBaseUrl) {
    printInfo(`Skipping health check for "${params.envName}" because no local API URL is saved for this env.`);
    return;
  }

  const healthCheckUrl = buildHealthCheckUrl(apiBaseUrl);
  const startedAt = Date.now();
  let lastMessage = 'No response yet';
  let spinnerActive = true;

  startTask(`Waiting for NocoBase to become ready for "${params.envName}"...`);

  try {
    while (Date.now() - startedAt < APP_HEALTH_CHECK_TIMEOUT_MS) {
      const result = await requestAppHealthCheck({
        healthCheckUrl,
        fetchImpl: params.fetchImpl,
      });

      if (result.ok) {
        stopTask();
        spinnerActive = false;
        return;
      }

      lastMessage = result.message;
      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
      updateTask(
        `Waiting for NocoBase to become ready for "${params.envName}"... (${elapsedSeconds}s elapsed, last status: ${lastMessage})`,
      );
      await sleep(APP_HEALTH_CHECK_INTERVAL_MS);
    }
  } finally {
    if (spinnerActive) {
      stopTask();
    }
  }

  const hints = [
    params.logHint,
    params.containerName ? `docker logs ${params.containerName}` : undefined,
  ].filter(Boolean);
  const hintText = hints.length > 0 ? ` ${hints.join(' ')}` : '';
  throw new AppHealthCheckError(
    `NocoBase did not become ready in time for "${params.envName}". Expected \`${healthCheckUrl}\` to respond with \`ok\`, but the last status was: ${lastMessage}.${hintText}`,
  );
}
