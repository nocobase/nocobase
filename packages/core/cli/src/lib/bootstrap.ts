/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getCurrentEnvName, getEnv, setEnvRuntime, updateEnvConnection } from './auth-store.js';
import type { CliHomeScope } from './cli-home.js';
import { resolveAccessToken } from './env-auth.js';
import { fetchWithPreservedAuthRedirect } from './http-request.js';
import { generateRuntime } from './runtime-generator.js';
import { hasRuntimeSync, saveRuntime } from './runtime-store.js';
import { confirmAction, printInfo, printVerbose, printWarningBlock, setVerboseMode, stopTask, updateTask } from './ui.js';

const APP_RETRY_INTERVAL = 2000;
const APP_RETRY_TIMEOUT = 120000;

function readFlag(argv: string[], name: string) {
  const exact = `--${name}`;
  const prefix = `--${name}=`;
  const alias = name === 'env' ? '-e' : name === 'scope' ? '-s' : undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === exact) {
      return argv[index + 1];
    }
    if (alias && value === alias) {
      return argv[index + 1];
    }
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }

  return undefined;
}

function hasBooleanFlag(argv: string[], name: string) {
  const exact = `--${name}`;
  const negated = `--no-${name}`;
  const prefix = `--${name}=`;
  const alias = name === 'verbose' ? '-V' : undefined;

  for (const value of argv) {
    if (value === exact) {
      return true;
    }

    if (alias && value === alias) {
      return true;
    }

    if (value === negated) {
      return false;
    }

    if (value.startsWith(prefix)) {
      return value.slice(prefix.length) !== 'false';
    }
  }

  return false;
}

function getCommandToken(argv: string[]) {
  const tokens: string[] = [];

  for (const token of argv) {
    if (!token || token.startsWith('-')) {
      continue;
    }

    tokens.push(token);
  }

  if (tokens[0] === 'api') {
    return tokens[1] ?? tokens[0];
  }

  return tokens[0];
}

function hasHelpFlag(argv: string[]) {
  return argv.includes('--help') || argv.includes('-h');
}

function hasVersionFlag(argv: string[]) {
  return argv.includes('--version') || argv.includes('-v');
}

function isBuiltinCommand(argv: string[]) {
  const commandTokens = argv.filter((token) => token && !token.startsWith('-'));
  const [topic, subtopic] = commandTokens;

  return topic === 'env' || topic === 'resource' || (topic === 'api' && subtopic === 'resource');
}

export function shouldSkipRuntimeBootstrap(argv: string[]) {
  return hasVersionFlag(argv) || isBuiltinCommand(argv);
}

function shouldIgnoreBootstrapFailure(argv: string[], commandToken?: string) {
  return !commandToken || hasHelpFlag(argv) || (commandToken === 'api' && argv.length === 1);
}

async function requestJson(url: string, options: { method?: string; token?: string; role?: string }) {
  const headers = new Headers();
  if (options.token) {
    headers.set('authorization', `Bearer ${options.token}`);
  }
  if (options.role) {
    headers.set('x-role', options.role);
  }

  let response: Response;
  try {
    response = await fetchWithPreservedAuthRedirect(url, {
      method: options.method ?? 'GET',
      headers,
    });
  } catch (error: any) {
    return {
      status: 0,
      ok: false,
      data: {
        error: {
          message: error?.message ?? 'fetch failed',
        },
      },
    };
  }

  const text = await response.text();
  let data: any = undefined;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    data,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAppRestarting(response: { status: number; data: any }) {
  return response.status === 503 && response.data?.error?.code === 'APP_COMMANDING';
}

function shouldRetryAppAvailability(response: { status: number; data: any }) {
  return isAppRestarting(response) || response.status === 0;
}

function getSwaggerUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/swagger:get`;
}

function getHealthCheckUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/__health_check`;
}

async function waitForServiceReady(baseUrl: string, token?: string, role?: string) {
  const healthCheckUrl = getHealthCheckUrl(baseUrl);
  const startedAt = Date.now();
  let notified = false;

  while (Date.now() - startedAt < APP_RETRY_TIMEOUT) {
    const response = await fetchWithPreservedAuthRedirect(healthCheckUrl, {
      method: 'GET',
      headers:
        token || role
          ? {
              ...(token ? { authorization: `Bearer ${token}` } : undefined),
              ...(role ? { 'x-role': role } : undefined),
            }
          : undefined,
    }).catch((error: any) => {
      return {
        ok: false,
        status: 0,
        text: async () => error?.message ?? 'fetch failed',
      } as Response;
    });

    const text = await response.text();
    if (response.ok && text.trim().toLowerCase() === 'ok') {
      return;
    }

    if (!notified) {
      printVerbose(`Waiting for health check: ${healthCheckUrl}`);
      updateTask(`Waiting for application readiness (${healthCheckUrl})`);
      notified = true;
    }

    await sleep(APP_RETRY_INTERVAL);
  }

  throw new Error(`The application did not become ready in time. Expected \`${healthCheckUrl}\` to respond with \`ok\`.`);
}

async function waitForSwaggerSchema(baseUrl: string, token?: string, role?: string) {
  const swaggerUrl = getSwaggerUrl(baseUrl);
  const startedAt = Date.now();

  printVerbose(`Checking swagger schema: ${swaggerUrl}`);

  while (Date.now() - startedAt < APP_RETRY_TIMEOUT) {
    const response = await requestJson(swaggerUrl, { token, role });
    if (response.ok) {
      return response;
    }

    if (!shouldRetryAppAvailability(response)) {
      return response;
    }

    await waitForServiceReady(baseUrl, token, role);
  }

  return await requestJson(swaggerUrl, { token, role });
}

async function confirmEnableApiDoc() {
  return confirmAction('Enable the API documentation plugin now?', { defaultValue: false });
}

async function fetchSwaggerSchema(
  baseUrl: string,
  token?: string,
  role?: string,
  context: {
    envName?: string;
    commandToken?: string;
  } = {},
  options: {
    allowEnableApiDoc?: boolean;
    retryAppAvailability?: boolean;
  } = {},
) {
  let response =
    options.retryAppAvailability === false
      ? await requestJson(getSwaggerUrl(baseUrl), { token, role })
      : await waitForSwaggerSchema(baseUrl, token, role);

  if (response.status === 404) {
    if (options.allowEnableApiDoc === false) {
      throw new Error('`swagger:get` returned 404. Check the base URL and enable the `API documentation plugin` if needed.');
    }

    printInfo('The API documentation plugin is not enabled.');
    const shouldEnable = await confirmEnableApiDoc();
    if (!shouldEnable) {
      throw new Error('`swagger:get` returned 404. Enable the `API documentation plugin` first.');
    }

    const enableUrl = `${baseUrl.replace(/\/+$/, '')}/pm:enable?filterByTk=api-doc`;
    printVerbose(`Enabling API documentation plugin via ${enableUrl}`);
    const enableResponse = await requestJson(enableUrl, { method: 'POST', token, role });
    if (!enableResponse.ok) {
      throw new Error(
        `Failed to enable the \`API documentation plugin\` via \`pm:enable\`.\n${JSON.stringify(enableResponse.data, null, 2)}`,
      );
    }

    updateTask('Enabled the API documentation plugin. Waiting for application readiness...');
    await waitForServiceReady(baseUrl, token, role);
    response = await waitForSwaggerSchema(baseUrl, token, role);
  }

  if (!response.ok) {
    throw new Error(formatSwaggerSchemaError(response, { baseUrl, token, ...context }));
  }

  return (response.data?.data ?? response.data) as any;
}

function collectErrorEntries(data: any) {
  if (Array.isArray(data?.errors)) {
    return data.errors.filter(Boolean);
  }

  if (data?.error) {
    return [data.error];
  }

  return [];
}

function hasAuthenticationError(data: any) {
  return collectErrorEntries(data).some((entry) =>
    entry?.code === 'INVALID_TOKEN' || entry?.code === 'EMPTY_TOKEN',
  );
}

function isNetworkFetchFailure(response: { status: number; data: any }) {
  return response.status === 0;
}

export function formatSwaggerSchemaError(
  response: { status: number; data: any },
  context: { baseUrl: string; token?: string; role?: string; envName?: string; commandToken?: string },
) {
  if (hasAuthenticationError(response.data)) {
    const entries = collectErrorEntries(response.data);
    const details = entries
      .map((entry) => {
        const code = entry?.code ? `[${entry.code}] ` : '';
        return `${code}${entry?.message ?? 'Authentication failed.'}`;
      })
      .join('\n');
    const envLabel = context.envName ? ` for env "${context.envName}"` : '';
    const commandHint = context.commandToken
      ? `If \`${context.commandToken}\` is a runtime command, refresh the runtime after updating the token with \`nb env update\`. If it is a typo, run \`nb --help\` to inspect available commands.`
      : 'Run `nb --help` to inspect built-in commands, then refresh runtime commands with `nb env update` after updating the token.';

    return [
      `Authentication failed while loading the command runtime from \`swagger:get\`${envLabel}.`,
      `Base URL: ${context.baseUrl}`,
      details,
      'Update the API key with `nb env add <name> --api-base-url <url> --auth-type token --token <api-key>`, log in with `nb env auth <name>`, or rerun the command with `--token <api-key>`.',
      commandHint,
    ].join('\n');
  }

  if (isNetworkFetchFailure(response)) {
    const rawMessage = response.data?.error?.message || 'fetch failed';
    return [
      'Failed to reach the NocoBase server while loading the command runtime from `swagger:get`.',
      `Base URL: ${context.baseUrl}`,
      `Network error: ${rawMessage}`,
      'Check that the NocoBase app is running, the base URL is correct, and the server is reachable from this machine.',
      'If you recently changed the server address, update it with `nb env add <name> --api-base-url <url>` and retry `nb env update`.',
      'Use `nb env list` to inspect the current env configuration.',
    ].join('\n');
  }

  return `Failed to load swagger schema from \`swagger:get\`.\n${JSON.stringify(response.data, null, 2)}`;
}

export function formatMissingRuntimeEnvError(commandToken?: string) {
  if (!commandToken) {
    return [
      'No env is configured for runtime commands.',
      'Run `nb env add <name> --api-base-url <url>` first.',
      'If you configure multiple environments later, switch with `nb env use <name>`.',
    ].join('\n');
  }

  return [
    `Unable to resolve runtime command \`${commandToken}\`.`,
    'No env is configured, so the CLI cannot load runtime commands from `swagger:get`.',
    'If this is a built-in command or a typo, run `nb --help` to inspect available commands.',
    'If this should be an application runtime command, run `nb env add <name> --api-base-url <url>` and then `nb env update`.',
  ].join('\n');
}

export async function ensureRuntimeFromArgv(argv: string[], options: { configFile: string }) {
  const commandToken = getCommandToken(argv);
  const isRootInvocation = !commandToken;
  const canContinueWithoutRuntime = shouldIgnoreBootstrapFailure(argv, commandToken);
  setVerboseMode(hasBooleanFlag(argv, 'verbose'));

  if (shouldSkipRuntimeBootstrap(argv)) {
    return;
  }

  try {
    const envName = readFlag(argv, 'env') ?? (await getCurrentEnvName());
    const env = await getEnv(envName);
    const baseUrl = readFlag(argv, 'api-base-url') ?? env?.baseUrl;
    const role = readFlag(argv, 'role');
    const token = await resolveAccessToken({
      envName,
      baseUrl,
      token: readFlag(argv, 'token'),
    });
    const runtimeVersion = env?.runtime?.version;

    if (runtimeVersion && hasRuntimeSync(runtimeVersion)) {
      return;
    }

    if (!baseUrl) {
      if (isRootInvocation) {
        return;
      }
      throw new Error(formatMissingRuntimeEnvError(commandToken));
    }

    updateTask('Loading command runtime...');
    try {
      printVerbose(`Runtime source: ${baseUrl}`);
      const document = await fetchSwaggerSchema(
        baseUrl,
        token,
        role,
        { envName, commandToken },
        isRootInvocation
          ? {
              allowEnableApiDoc: false,
              retryAppAvailability: false,
            }
          : undefined,
      );
      const runtime = await generateRuntime(document, options.configFile, baseUrl);
      await saveRuntime(runtime);
      await setEnvRuntime(envName, {
        version: runtime.version,
        schemaHash: runtime.schemaHash,
        generatedAt: runtime.generatedAt,
      });
    } finally {
      stopTask();
    }
  } catch (error) {
    if (!canContinueWithoutRuntime) {
      throw error;
    }

    stopTask();
    const message = error instanceof Error ? error.message : String(error);
    printWarningBlock(`Unable to load runtime commands. Showing built-in help instead.\n\n${message}`);
  }
}

export async function updateEnvRuntime(options: {
  envName?: string;
  baseUrl?: string;
  token?: string;
  role?: string;
  configFile: string;
  verbose?: boolean;
  scope?: CliHomeScope;
}) {
  setVerboseMode(Boolean(options.verbose));
  const envName = options.envName ?? (await getCurrentEnvName({ scope: options.scope }));
  const env = await getEnv(envName, { scope: options.scope });
  const baseUrl = options.baseUrl ?? env?.baseUrl;
  const token = await resolveAccessToken({
    envName,
    baseUrl,
    token: options.token,
    scope: options.scope,
  });

  if (!baseUrl) {
    throw new Error(
      [
        env
          ? `Env "${envName}" is missing a base URL.`
          : `Env "${envName}" is not configured. Run \`nb env add ${envName}\` first.`,
        env ? 'Update it with `nb env add <name> --api-base-url <url>` first.' : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  updateTask('Loading command runtime...');
  try {
    printVerbose(`Runtime source: ${baseUrl}`);
    const document = await fetchSwaggerSchema(baseUrl, token, options.role, { envName });
    const runtime = await generateRuntime(document, options.configFile, baseUrl);
    await saveRuntime(runtime, { scope: options.scope });
    if (options.baseUrl !== undefined || options.token !== undefined) {
      await updateEnvConnection(
        envName,
        {
          apiBaseUrl: options.baseUrl,
          accessToken: options.token,
        },
        { scope: options.scope },
      );
    }
    await setEnvRuntime(envName, {
      version: runtime.version,
      schemaHash: runtime.schemaHash,
      generatedAt: runtime.generatedAt,
    }, { scope: options.scope });
    return runtime;
  } finally {
    stopTask();
  }
}
