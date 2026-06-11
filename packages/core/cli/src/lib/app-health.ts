/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ManagedAppRuntime } from './app-runtime.js';
import { buildLocalApiBaseUrl, buildLocalAppUrl } from './app-public-path.js';
import { startDockerLogFollower } from './docker-log-stream.js';
import { printInfo } from './ui.js';

const APP_HEALTH_CHECK_INTERVAL_MS = 2_000;
const APP_HEALTH_CHECK_TIMEOUT_MS = 600_000;
const APP_HEALTH_CHECK_REQUEST_TIMEOUT_MS = 5_000;
const APP_HEALTH_CHECK_PROGRESS_LOG_INTERVAL_MS = 10_000;

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

export function formatAppUrl(port?: string, appPublicPath?: string): string | undefined {
  return buildLocalAppUrl(port, appPublicPath);
}

export function resolveManagedAppApiBaseUrl(
  runtime: Extract<ManagedAppRuntime, { kind: 'local' | 'docker' }>,
  options?: { portOverride?: string },
): string | undefined {
  const override = trimValue(options?.portOverride);
  if (override) {
    return buildLocalApiBaseUrl(override, runtime.env.config?.appPublicPath);
  }

  const baseUrl = trimValue(runtime.env.baseUrl);
  if (baseUrl) {
    return baseUrl.replace(/\/+$/, '');
  }

  const appPort =
    runtime.env.appPort === undefined || runtime.env.appPort === null
      ? ''
      : trimValue(runtime.env.appPort);
  return buildLocalApiBaseUrl(appPort, runtime.env.config?.appPublicPath);
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
  verbose?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  intervalMs?: number;
  requestTimeoutMs?: number;
  progressLogIntervalMs?: number;
}): Promise<void> {
  const apiBaseUrl = trimValue(params.apiBaseUrl);
  if (!apiBaseUrl) {
    printInfo(`Skipping health check for "${params.envName}" because no local API URL is saved for this env.`);
    return;
  }

  const healthCheckUrl = buildHealthCheckUrl(apiBaseUrl);
  const startedAt = Date.now();
  const timeoutMs = params.timeoutMs ?? APP_HEALTH_CHECK_TIMEOUT_MS;
  const intervalMs = params.intervalMs ?? APP_HEALTH_CHECK_INTERVAL_MS;
  const progressLogIntervalMs = Math.max(
    1,
    params.progressLogIntervalMs ?? APP_HEALTH_CHECK_PROGRESS_LOG_INTERVAL_MS,
  );
  let lastMessage = 'No response yet';
  let nextProgressLogAt = startedAt + progressLogIntervalMs;

  printInfo(`Waiting for NocoBase to become ready for "${params.envName}"...`);
  const dockerLogFollower =
    params.verbose && params.containerName ? startDockerLogFollower(params.containerName) : undefined;

  try {
    while (Date.now() - startedAt < timeoutMs) {
      const result = await requestAppHealthCheck({
        healthCheckUrl,
        fetchImpl: params.fetchImpl,
        requestTimeoutMs: params.requestTimeoutMs,
      });

      if (result.ok) {
        return;
      }

      lastMessage = result.message;
      const now = Date.now();
      if (now >= nextProgressLogAt) {
        const elapsedSeconds = Math.max(1, Math.floor((now - startedAt) / 1000));
        printInfo(`Still waiting for "${params.envName}"... (${elapsedSeconds}s elapsed)`);
        while (nextProgressLogAt <= now) {
          nextProgressLogAt += progressLogIntervalMs;
        }
      }
      const remainingMs = timeoutMs - (Date.now() - startedAt);
      if (remainingMs <= 0) {
        break;
      }
      await sleep(Math.min(intervalMs, remainingMs));
    }

    const hints = [
      params.logHint,
      params.containerName ? `docker logs ${params.containerName}` : undefined,
    ].filter(Boolean);
    const hintText = hints.length > 0 ? ` ${hints.join(' ')}` : '';
    throw new AppHealthCheckError(
      `NocoBase did not become ready in time for "${params.envName}". Expected \`${healthCheckUrl}\` to respond with \`ok\`, but the last status was: ${lastMessage}.${hintText}`,
    );
  } finally {
    await dockerLogFollower?.stop();
  }
}
