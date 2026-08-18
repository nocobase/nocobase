/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn, type ChildProcessWithoutNullStreams, type SpawnOptionsWithoutStdio } from 'node:child_process';

import type { LookupAddress } from 'node:dns';
import { Resolver } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

import { matchesDomainPattern } from '@nocobase/utils';

import type { VscGitRemoteTransport } from '../../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError } from '../../RemoteSyncAdapter';
import { GitCredentialMaterializer, type MaterializedGitCredential } from './GitCredentialMaterializer';
import { mapGitCommandError, mapGitNetworkPolicyError, type GitCommandTerminationReason } from './gitCommandError';

const defaultLimits: GitCommandLimits = {
  timeoutMs: 30_000,
  terminationGraceMs: 500,
  maxStdoutBytes: 2 * 1024 * 1024,
  maxStderrBytes: 256 * 1024,
  maxStdinBytes: 12 * 1024 * 1024,
};
const catFileStdoutLimit = 12 * 1024 * 1024;
const lsTreeStdoutLimit = 8 * 1024 * 1024;
const allowedCommands = new Set([
  'cat-file',
  'commit-tree',
  'fetch',
  'hash-object',
  'init',
  'ls-remote',
  'ls-tree',
  'push',
  'read-tree',
  'rev-parse',
  'update-index',
  'write-tree',
]);
const prohibitedCommandArguments = [
  '--config-env',
  '--exec',
  '--exec-path',
  '--repo',
  '--upload-pack',
  '--receive-pack',
];
const networkCommands = new Set(['fetch', 'ls-remote', 'push']);
const allowedCommandEnvironment = new Set([
  'GIT_AUTHOR_DATE',
  'GIT_AUTHOR_EMAIL',
  'GIT_AUTHOR_NAME',
  'GIT_COMMITTER_DATE',
  'GIT_COMMITTER_EMAIL',
  'GIT_COMMITTER_NAME',
  'GIT_INDEX_FILE',
]);
const trustedProxyEnvironmentVariables = new Set([
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy',
]);
const defaultPathEnvironment =
  process.platform === 'win32' ? process.env.PATH || process.env.Path || '' : '/usr/local/bin:/usr/bin:/bin';

export interface GitCommandLimits {
  timeoutMs: number;
  terminationGraceMs: number;
  maxStdoutBytes: number;
  maxStderrBytes: number;
  maxStdinBytes: number;
}

export interface GitCommandRunnerOptions {
  gitBinary?: string;
  pathEnvironment?: string;
  proxyEnvironmentVariables?: readonly string[];
  limits?: Partial<GitCommandLimits>;
  commandLimits?: Readonly<Record<string, Partial<GitCommandLimits>>>;
  materializer?: GitCredentialMaterializer;
  spawnProcess?: GitSpawnProcess;
  urlPolicyChecker?: GitRemoteNetworkPolicyChecker;
  resolveHost?: GitHostResolver;
}

export interface GitRemoteNetworkResolution {
  address: string;
  host: string;
  port: number;
}

export type GitRemoteNetworkPolicyChecker = (
  url: string,
) => void | GitRemoteNetworkResolution | Promise<void | GitRemoteNetworkResolution>;

export type GitHostResolver = (host: string) => Promise<readonly LookupAddress[]>;

export interface GitCommandRequest {
  args: readonly string[];
  cwd?: string;
  remoteUrl?: string;
  transport?: VscGitRemoteTransport;
  credential?: unknown;
  environment?: Readonly<Record<string, string>>;
  stdin?: Buffer | string;
  signal?: AbortSignal;
  acceptableExitCodes?: readonly number[];
  operation?: string;
}

export interface GitCommandResult {
  exitCode: number;
  stdout: Buffer;
  stderr: Buffer;
  durationMs: number;
}

export interface GitBinaryCapability {
  available: boolean;
  version?: string;
  reasonCode?: 'git-binary-unavailable';
}

export type GitSpawnProcess = (
  command: string,
  args: readonly string[],
  options: SpawnOptionsWithoutStdio,
) => ChildProcessWithoutNullStreams;

interface ExecuteProcessRequest {
  binary: string;
  binaryKind: 'git';
  args: readonly string[];
  cwd: string;
  environment: NodeJS.ProcessEnv;
  limits: GitCommandLimits;
  acceptableExitCodes: ReadonlySet<number>;
  operation?: string;
  credentialProvided: boolean;
  stdin?: Buffer | string;
  signal?: AbortSignal;
}

export class GitCommandRunner {
  private readonly gitBinary: string;

  private readonly pathEnvironment: string;

  private readonly proxyEnvironmentVariables: readonly string[];

  private readonly limits: GitCommandLimits;

  private readonly limitOverrides: Partial<GitCommandLimits>;

  private readonly commandLimits: Readonly<Record<string, Partial<GitCommandLimits>>>;

  private readonly materializer: GitCredentialMaterializer;

  private readonly spawnProcess: GitSpawnProcess;

  private readonly urlPolicyChecker: GitRemoteNetworkPolicyChecker;

  private gitCapabilityPromise?: Promise<GitBinaryCapability>;

  constructor(options: GitCommandRunnerOptions = {}) {
    this.gitBinary = requireTrustedBinary(options.gitBinary || 'git', 'Git');
    this.pathEnvironment = options.pathEnvironment || defaultPathEnvironment;
    this.proxyEnvironmentVariables = validateProxyEnvironmentVariables(options.proxyEnvironmentVariables || []);
    this.limitOverrides = options.limits || {};
    this.limits = mergeAndValidateLimits(defaultLimits, this.limitOverrides);
    this.commandLimits = options.commandLimits || {};
    this.materializer = options.materializer || new GitCredentialMaterializer();
    this.spawnProcess = options.spawnProcess || spawn;
    const resolveHost: GitHostResolver = options.resolveHost || resolveGitHost;
    this.urlPolicyChecker = options.urlPolicyChecker || ((url) => enforceGitRemoteNetworkPolicy(url, resolveHost));
  }

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    const command = validateCommand(request.args);
    const target = this.validateRemoteTarget(request, command);
    let networkResolution: GitRemoteNetworkResolution | void;
    if (target) {
      try {
        networkResolution = await this.urlPolicyChecker(target.policyUrl);
      } catch {
        throw mapGitNetworkPolicyError(request.operation || command);
      }
    }
    if (request.signal?.aborted) {
      throw mapGitCommandError({
        binary: 'git',
        operation: request.operation || command,
        terminationReason: 'aborted',
      });
    }

    const gitCapability = await this.probeGit();
    if (!gitCapability.available) {
      throw mapGitCommandError({ binary: 'git', errorCode: 'ENOENT', operation: request.operation || command });
    }
    const materialized = await this.materializer.materialize({
      transport: target?.transport || 'https',
      credential: request.credential,
    });
    try {
      const limits = this.getLimitsForCommand(command);
      const gitArgs = addFixedGitConfiguration(request.args, materialized.hooksDirectory, networkResolution);
      const environment = this.buildEnvironment(materialized, request.environment);
      return await this.executeProcess({
        binary: this.gitBinary,
        binaryKind: 'git',
        args: gitArgs,
        cwd: request.cwd || materialized.rootDirectory,
        environment,
        limits,
        acceptableExitCodes: new Set(request.acceptableExitCodes || [0]),
        operation: request.operation || command,
        credentialProvided: request.credential !== null && request.credential !== undefined,
        stdin: request.stdin,
        signal: request.signal,
      });
    } finally {
      await materialized.cleanup();
    }
  }

  probeGit(): Promise<GitBinaryCapability> {
    this.gitCapabilityPromise ||= this.probeBinary(this.gitBinary, 'git', ['--version']);
    return this.gitCapabilityPromise;
  }

  resetCapabilityCache(): void {
    this.gitCapabilityPromise = undefined;
  }

  private async probeBinary(binary: string, binaryKind: 'git', args: readonly string[]): Promise<GitBinaryCapability> {
    const materialized = await this.materializer.materialize({ transport: 'https' });
    try {
      const result = await this.executeProcess({
        binary,
        binaryKind,
        args,
        cwd: materialized.rootDirectory,
        environment: this.buildEnvironment(materialized),
        limits: {
          ...this.limits,
          maxStdoutBytes: Math.min(this.limits.maxStdoutBytes, 64 * 1024),
          maxStderrBytes: Math.min(this.limits.maxStderrBytes, 64 * 1024),
        },
        acceptableExitCodes: new Set([0]),
        operation: `${binaryKind}-version`,
        credentialProvided: false,
      });
      const version = Buffer.concat([result.stdout, result.stderr]).toString('utf8').trim().slice(0, 256);
      return { available: true, ...(version ? { version } : {}) };
    } catch {
      return { available: false, reasonCode: `${binaryKind}-binary-unavailable` };
    } finally {
      await materialized.cleanup();
    }
  }

  private validateRemoteTarget(
    request: GitCommandRequest,
    command: string,
  ): { policyUrl: string; transport: VscGitRemoteTransport } | null {
    if (!request.remoteUrl && !request.transport) {
      if (networkCommands.has(command)) {
        throw invalidRequest('Network Git commands require a validated remote target', 'remote-target-required');
      }
      if (request.credential !== null && request.credential !== undefined) {
        throw invalidRequest('Git credentials require a remote target', 'credential-without-target');
      }
      return null;
    }
    if (!request.remoteUrl || !request.transport) {
      throw invalidRequest('Git remote URL and transport must be supplied together', 'incomplete-remote-target');
    }
    if (networkCommands.has(command) && getNetworkRemoteArgument(request.args) !== request.remoteUrl) {
      throw invalidRequest('Git command target does not match the validated remote URL', 'remote-target-mismatch');
    }

    let url: URL;
    try {
      url = new URL(request.remoteUrl);
    } catch {
      throw invalidRequest('Git remote URL is invalid', 'invalid-url');
    }
    if (!url.hostname || url.search || url.hash || url.password) {
      throw invalidRequest('Git remote URL is invalid', 'invalid-url');
    }
    if (url.protocol !== `${request.transport}:` || url.username) {
      throw invalidRequest('Git remote URL does not match the HTTP transport', 'transport-mismatch');
    }
    if (request.transport === 'http' && request.credential !== null && request.credential !== undefined) {
      throw invalidRequest('HTTP Git remotes do not support credentials; use HTTPS', 'http-auth-forbidden');
    }
    return { policyUrl: url.toString(), transport: request.transport };
  }

  private buildEnvironment(
    materialized: MaterializedGitCredential,
    commandEnvironment: Readonly<Record<string, string>> = {},
  ): NodeJS.ProcessEnv {
    for (const name of Object.keys(commandEnvironment)) {
      if (!allowedCommandEnvironment.has(name)) {
        throw invalidRequest('Git command environment contains an unsupported variable', 'unsupported-environment');
      }
    }

    const environment: NodeJS.ProcessEnv = {
      PATH: this.pathEnvironment,
      LANG: 'C',
      LC_ALL: 'C',
      ...materialized.environment,
      ...commandEnvironment,
    };
    for (const name of this.proxyEnvironmentVariables) {
      const value = process.env[name];
      if (value !== undefined) {
        environment[name] = value;
      }
    }
    return environment;
  }

  private getLimitsForCommand(command: string): GitCommandLimits {
    const commandDefaults =
      command === 'cat-file'
        ? { maxStdoutBytes: catFileStdoutLimit }
        : command === 'ls-tree'
          ? { maxStdoutBytes: lsTreeStdoutLimit }
          : undefined;
    return mergeAndValidateLimits(
      mergeAndValidateLimits(mergeAndValidateLimits(defaultLimits, commandDefaults), this.limitOverrides),
      this.commandLimits[command],
    );
  }

  private executeProcess(request: ExecuteProcessRequest): Promise<GitCommandResult> {
    if (request.stdin !== undefined && Buffer.byteLength(request.stdin) > request.limits.maxStdinBytes) {
      throw new RemoteSyncError('UNSAFE_CONTENT', 'Git command input exceeded its size limit', {
        details: { provider: 'git', operation: request.operation, reasonCode: 'command-input-limit' },
      });
    }

    return new Promise((resolve, reject) => {
      const startedAt = Date.now();
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let terminationReason: GitCommandTerminationReason | undefined;
      let terminationTimer: NodeJS.Timeout | undefined;
      let settled = false;
      let childClosed = false;
      let pendingExitCode: number | null = null;

      const child = this.spawnProcess(request.binary, request.args, {
        shell: false,
        cwd: request.cwd,
        env: request.environment,
        detached: process.platform !== 'win32',
        windowsHide: true,
        stdio: 'pipe',
      });

      const killProcessTree = (signal: NodeJS.Signals) => {
        if (!child.pid) {
          return;
        }
        if (process.platform !== 'win32') {
          try {
            process.kill(-child.pid, signal);
            return;
          } catch {
            // The child may have exited between the event and the signal.
          }
        }
        try {
          child.kill(signal);
        } catch {
          // The child is already gone.
        }
      };

      const beginTermination = (reason: GitCommandTerminationReason) => {
        if (terminationReason) {
          return;
        }
        terminationReason = reason;
        killProcessTree('SIGTERM');
        terminationTimer = setTimeout(() => {
          killProcessTree('SIGKILL');
          terminationTimer = undefined;
          if (childClosed) {
            finishClose(pendingExitCode);
          }
        }, request.limits.terminationGraceMs);
        terminationTimer.unref();
      };

      const timeout = setTimeout(() => beginTermination('timeout'), request.limits.timeoutMs);
      timeout.unref();
      const abortListener = () => beginTermination('aborted');
      request.signal?.addEventListener('abort', abortListener, { once: true });

      const appendOutput = (target: Buffer[], chunk: Buffer, currentBytes: number, maximumBytes: number) => {
        const availableBytes = Math.max(0, maximumBytes - currentBytes);
        if (availableBytes > 0) {
          target.push(chunk.subarray(0, availableBytes));
        }
        return currentBytes + chunk.length;
      };

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes = appendOutput(stdout, chunk, stdoutBytes, request.limits.maxStdoutBytes);
        if (stdoutBytes > request.limits.maxStdoutBytes) {
          beginTermination('stdout-limit');
        }
      });
      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes = appendOutput(stderr, chunk, stderrBytes, request.limits.maxStderrBytes);
        if (stderrBytes > request.limits.maxStderrBytes) {
          beginTermination('stderr-limit');
        }
      });
      child.stdin.on('error', () => {
        // A command may close stdin before consuming all input; its exit status remains authoritative.
      });
      child.on('error', (error: NodeJS.ErrnoException) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        if (terminationTimer) {
          clearTimeout(terminationTimer);
        }
        request.signal?.removeEventListener('abort', abortListener);
        reject(
          mapGitCommandError({
            binary: request.binaryKind,
            operation: request.operation,
            errorCode: error.code,
            credentialProvided: request.credentialProvided,
          }),
        );
      });
      const finishClose = (exitCode: number | null) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        if (terminationTimer) {
          clearTimeout(terminationTimer);
        }
        request.signal?.removeEventListener('abort', abortListener);
        const result = {
          exitCode: exitCode ?? -1,
          stdout: Buffer.concat(stdout),
          stderr: Buffer.concat(stderr),
          durationMs: Date.now() - startedAt,
        };
        if (!terminationReason && request.acceptableExitCodes.has(result.exitCode)) {
          resolve(result);
          return;
        }
        reject(
          mapGitCommandError({
            binary: request.binaryKind,
            operation: request.operation,
            exitCode,
            stderr: result.stderr,
            terminationReason,
            credentialProvided: request.credentialProvided,
          }),
        );
      };
      child.on('close', (exitCode) => {
        if (terminationReason && terminationTimer) {
          childClosed = true;
          pendingExitCode = exitCode;
          return;
        }
        finishClose(exitCode);
      });

      if (request.signal?.aborted) {
        beginTermination('aborted');
      }
      child.stdin.end(request.stdin);
    });
  }
}

async function resolveGitHost(host: string): Promise<readonly LookupAddress[]> {
  const resolver = new Resolver();
  const [ipv4, ipv6] = await Promise.all([
    resolver.resolve4(host).catch(() => []),
    resolver.resolve6(host).catch(() => []),
  ]);
  return [
    ...ipv4.map((address) => ({ address, family: 4 as const })),
    ...ipv6.map((address) => ({ address, family: 6 as const })),
  ];
}

async function enforceGitRemoteNetworkPolicy(
  value: string,
  resolveHost: GitHostResolver,
): Promise<GitRemoteNetworkResolution | void> {
  const url = new URL(value);
  const host = normalizedHostname(url);
  const allowlist = process.env.SERVER_REQUEST_WHITELIST?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const hostAllowed = Boolean(allowlist?.some((entry) => matchesGitAllowlistEntry(host, entry)));

  if (isBlockedGitTarget(host) && !hostAllowed) {
    throw new Error('Git target is blocked by network policy');
  }
  if (ipaddr.isValid(host)) {
    return;
  }

  const addresses = await resolveHost(host);
  if (
    addresses.length === 0 ||
    addresses.some(
      (address) =>
        isBlockedGitTarget(address.address) &&
        !hostAllowed &&
        !allowlist?.some((entry) => matchesGitAllowlistEntry(address.address, entry)),
    )
  ) {
    throw new Error('Git target resolves to a blocked network address');
  }
  return {
    address: normalizeIpAddress(ipaddr.parse(addresses[0].address)).toString(),
    host,
    port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
  };
}

function normalizedHostname(url: URL): string {
  return url.hostname.startsWith('[') && url.hostname.endsWith(']') ? url.hostname.slice(1, -1) : url.hostname;
}

function matchesGitAllowlistEntry(host: string, entry: string): boolean {
  if (!ipaddr.isValid(host)) {
    return matchesDomainPattern(host, entry);
  }
  try {
    const address = normalizeIpAddress(ipaddr.parse(host));
    if (entry.includes('/')) {
      const cidr = ipaddr.parseCIDR(entry);
      if (address.kind() !== cidr[0].kind()) {
        return false;
      }
      return address.kind() === 'ipv4'
        ? (address as ipaddr.IPv4).match(cidr as [ipaddr.IPv4, number])
        : (address as ipaddr.IPv6).match(cidr as [ipaddr.IPv6, number]);
    }
    return address.toString() === normalizeIpAddress(ipaddr.parse(entry)).toString();
  } catch {
    return false;
  }
}

function isBlockedGitTarget(host: string): boolean {
  if (host.toLowerCase() === 'localhost' || host.toLowerCase() === 'metadata.google.internal') {
    return true;
  }
  if (!ipaddr.isValid(host)) {
    return false;
  }
  return normalizeIpAddress(ipaddr.parse(host)).range() !== 'unicast';
}

function normalizeIpAddress(address: ipaddr.IPv4 | ipaddr.IPv6): ipaddr.IPv4 | ipaddr.IPv6 {
  return address.kind() === 'ipv6' && (address as ipaddr.IPv6).isIPv4MappedAddress()
    ? (address as ipaddr.IPv6).toIPv4Address()
    : address;
}

function validateCommand(args: readonly string[]): string {
  if (args.length === 0 || args.some((argument) => typeof argument !== 'string' || argument.includes('\0'))) {
    throw invalidRequest('Git command arguments are invalid', 'invalid-command-arguments');
  }
  if (args[0] === '--version' && args.length === 1) {
    return '--version';
  }
  const command = args[0];
  if (!allowedCommands.has(command)) {
    throw invalidRequest('Git command is not allowed', 'command-not-allowed');
  }
  if (
    args
      .slice(1)
      .some((argument) =>
        prohibitedCommandArguments.some(
          (prohibited) => argument === prohibited || argument.startsWith(`${prohibited}=`),
        ),
      )
  ) {
    throw invalidRequest('Git command argument is not allowed', 'command-argument-not-allowed');
  }
  return command;
}

function getNetworkRemoteArgument(args: readonly string[]): string | undefined {
  let optionsEnded = false;
  for (const argument of args.slice(1)) {
    if (!optionsEnded && argument === '--') {
      optionsEnded = true;
      continue;
    }
    if (!optionsEnded && argument.startsWith('-')) {
      continue;
    }
    return argument;
  }
  return undefined;
}

function addFixedGitConfiguration(
  args: readonly string[],
  hooksDirectory: string,
  networkResolution?: GitRemoteNetworkResolution | void,
): string[] {
  const curlResolution = networkResolution
    ? [
        '-c',
        `http.curloptResolve=${networkResolution.host}:${networkResolution.port}:${formatCurlResolveAddress(
          networkResolution.address,
        )}`,
      ]
    : [];
  return [
    '-c',
    'credential.helper=',
    '-c',
    `core.hooksPath=${hooksDirectory}`,
    '-c',
    'protocol.file.allow=never',
    '-c',
    'protocol.ext.allow=never',
    '-c',
    'http.followRedirects=false',
    ...curlResolution,
    ...args,
  ];
}

function formatCurlResolveAddress(address: string): string {
  return address.includes(':') ? `[${address}]` : address;
}

function mergeAndValidateLimits(base: GitCommandLimits, override?: Partial<GitCommandLimits>): GitCommandLimits {
  const limits = { ...base, ...override };
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`Git command limit ${name} must be a positive safe integer`);
    }
  }
  return limits;
}

function requireTrustedBinary(value: string, title: string): string {
  if (!value || value.includes('\0') || /[\r\n]/u.test(value)) {
    throw new TypeError(`${title} executable is invalid`);
  }
  return value;
}

function validateProxyEnvironmentVariables(names: readonly string[]): readonly string[] {
  for (const name of names) {
    if (!trustedProxyEnvironmentVariables.has(name)) {
      throw new TypeError(`Proxy environment variable ${name} is not allowed`);
    }
  }
  return [...new Set(names)];
}

function invalidRequest(message: string, reasonCode: string): RemoteSyncError {
  return new RemoteSyncError('CONFIG_INVALID', message, {
    details: { provider: 'git', reasonCode },
  });
}
