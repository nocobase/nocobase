/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import type { LightExtensionAgentLoopBudget } from '@nocobase/light-extension-sdk/agent-loop';
import { executeRawApiRequest } from '../../lib/api-client.js';
import { translateCli } from '../../lib/cli-locale.js';
import {
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  buildHttpError,
  buildWorkspaceSnapshotId,
  extractRejectedWorkspaceCheckResult,
  extractWorkspaceCheckResult,
  LIGHT_EXTENSION_EXIT_CODES,
  LightExtensionCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordRejectedWorkspaceCheck,
  recordSuccessfulWorkspaceCheck,
  recordWorkspaceAgentLoopEvent,
  resolveLightExtensionTarget,
  unwrapResponseData,
  type LightExtensionProblem,
  type LightExtensionResolvedTarget,
  type LightExtensionWorkspaceCheckResult,
  type LightExtensionWorkspaceFile,
  type LightExtensionWorkspaceState,
} from '../../lib/light-extension-workspace.js';

interface LightDevCheckOptions {
  workspaceRoot: string;
  state: LightExtensionWorkspaceState;
  files: LightExtensionWorkspaceFile[];
  target: LightExtensionResolvedTarget;
  role?: string;
  authenticator?: string;
  token?: string;
  budget: LightExtensionAgentLoopBudget;
}

interface LightDevCheckOutput {
  state: LightExtensionWorkspaceState;
  result: LightExtensionWorkspaceCheckResult;
}

export default class LightDev extends Command {
  static override summary = translateCli('commands.light.dev.summary', undefined, {
    fallback: 'Watch a local Light Extension workspace and run finite authoritative checks as JSONL',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./light-demo',
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --once',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.light.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
    }),
    once: Flags.boolean({
      description: translateCli('commands.light.dev.flags.once', undefined, {
        fallback: 'Check the current snapshot once instead of watching for source changes',
      }),
      default: false,
    }),
    'poll-interval': Flags.integer({
      description: translateCli('commands.light.dev.flags.pollInterval', undefined, {
        fallback: 'Local source polling interval in milliseconds',
      }),
      default: 200,
      min: 50,
      max: 30000,
    }),
    'debounce-ms': Flags.integer({
      description: translateCli('commands.light.dev.flags.debounceMs', undefined, {
        fallback: 'Wait for local source to remain unchanged before checking',
      }),
      default: 300,
      min: 0,
      max: 30000,
    }),
    'max-check-rounds': Flags.integer({
      description: translateCli('commands.light.dev.flags.maxCheckRounds', undefined, {
        fallback: 'Maximum authoritative check rounds before attention is required',
      }),
      default: 20,
      min: 1,
    }),
    'max-duration-ms': Flags.integer({
      description: translateCli('commands.light.dev.flags.maxDurationMs', undefined, {
        fallback: 'Maximum Agent loop duration in milliseconds',
      }),
      default: 15 * 60 * 1000,
      min: 1000,
    }),
    'repeated-fingerprint-threshold': Flags.integer({
      description: translateCli('commands.light.dev.flags.repeatedFingerprintThreshold', undefined, {
        fallback: 'Consecutive identical error fingerprint sets before attention is required',
      }),
      default: 3,
      min: 1,
    }),
    env: Flags.string({
      char: 'e',
      description: translateCli('commands.light.flags.env', undefined, { fallback: 'Environment name' }),
    }),
    'api-base-url': Flags.string({
      description: translateCli('commands.light.flags.apiBaseUrl', undefined, { fallback: 'NocoBase API base URL' }),
    }),
    role: Flags.string({
      description: translateCli('commands.light.flags.role', undefined, { fallback: 'Role override, sent as X-Role' }),
    }),
    authenticator: Flags.string({
      description: translateCli('commands.light.flags.authenticator', undefined, {
        fallback: 'Authenticator override, sent as X-Authenticator',
      }),
    }),
    token: Flags.string({
      char: 't',
      description: translateCli('commands.light.flags.token', undefined, { fallback: 'API key override' }),
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LightDev);
    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      let state = await loadWorkspaceState(workspaceRoot);
      const target = await resolveLightExtensionTarget({
        env: flags.env ?? state.env.name,
        apiBaseUrl: flags['api-base-url'] ?? state.app.apiBaseUrl,
      });
      assertTargetMatchesState(target, state);
      const budget: LightExtensionAgentLoopBudget = {
        maxCheckRounds: flags['max-check-rounds'],
        maxDurationMs: flags['max-duration-ms'],
        repeatedFingerprintThreshold: flags['repeated-fingerprint-threshold'],
      };
      let files = await readWorkspaceFiles(workspaceRoot, state);
      let output = await runAuthoritativeCheck({
        workspaceRoot,
        state,
        files,
        target,
        role: flags.role,
        authenticator: flags.authenticator,
        token: flags.token,
        budget,
      });
      state = output.state;
      writeCheckOutput(this, output.result, state);
      if (state.agentLoop?.status === 'needs_attention') {
        throw needsAttentionError(state);
      }
      if (flags.once) {
        if (!output.result.accepted) {
          throw rejectedCheckError(output.result);
        }
        return;
      }

      let observedSnapshotId = buildWorkspaceSnapshotId(files);
      let pendingSnapshotId: string | undefined;
      let changedAt = 0;
      for (;;) {
        await delay(flags['poll-interval']);
        files = await readWorkspaceFiles(workspaceRoot, state);
        const snapshotId = buildWorkspaceSnapshotId(files);
        if (snapshotId === observedSnapshotId) {
          if (Date.now() - Date.parse(state.agentLoop?.startedAt || new Date().toISOString()) >= budget.maxDurationMs) {
            state = await recordWorkspaceAgentLoopEvent({
              workspaceRoot,
              state,
              files,
              event: { type: 'budget_checked' },
              budget,
            });
            writeStateOutput(this, state);
            throw needsAttentionError(state);
          }
          continue;
        }
        if (pendingSnapshotId !== snapshotId) {
          pendingSnapshotId = snapshotId;
          changedAt = Date.now();
          continue;
        }
        if (Date.now() - changedAt < flags['debounce-ms']) {
          continue;
        }

        output = await runAuthoritativeCheck({
          workspaceRoot,
          state,
          files,
          target,
          role: flags.role,
          authenticator: flags.authenticator,
          token: flags.token,
          budget,
        });
        state = output.state;
        observedSnapshotId = snapshotId;
        pendingSnapshotId = undefined;
        writeCheckOutput(this, output.result, state);
        if (state.agentLoop?.status === 'needs_attention') {
          throw needsAttentionError(state);
        }
      }
    } catch (error: unknown) {
      const failure =
        error instanceof LightExtensionCliError
          ? error
          : new LightExtensionCliError(error instanceof Error ? error.message : String(error), { cause: error });
      this.logToStderr(JSON.stringify(failure.toJSON()));
      this.exit(failure.exitCode);
    }
  }
}

function writeCheckOutput(
  command: Pick<Command, 'log'>,
  result: LightExtensionWorkspaceCheckResult,
  state: LightExtensionWorkspaceState,
): void {
  for (const problem of result.problems) {
    command.log(JSON.stringify(toProblemOutput(problem, result, state)));
  }
  writeStateOutput(command, state, result);
}

function writeStateOutput(
  command: Pick<Command, 'log'>,
  state: LightExtensionWorkspaceState,
  result?: LightExtensionWorkspaceCheckResult,
): void {
  command.log(
    JSON.stringify({
      type: 'state',
      schemaVersion: 1,
      snapshotId: state.agentLoop?.snapshotId,
      contextHash: state.agentLoop?.contextHash,
      agentState: state.agentLoop?.status,
      accepted: result?.accepted,
      checkRounds: state.agentLoop?.checkRounds,
      needsAttentionReason: state.agentLoop?.needsAttentionReason,
    }),
  );
}

async function runAuthoritativeCheck(options: LightDevCheckOptions): Promise<LightDevCheckOutput> {
  const checkingState = await recordWorkspaceAgentLoopEvent({
    workspaceRoot: options.workspaceRoot,
    state: options.state,
    files: options.files,
    event: { type: 'check_started' },
    budget: options.budget,
  });
  if (checkingState.agentLoop?.status === 'needs_attention') {
    return {
      state: checkingState,
      result: {
        baseHeadCommitId: checkingState.baseHeadCommitId,
        snapshotId: buildWorkspaceSnapshotId(options.files),
        requestId: 'agent-loop-budget',
        accepted: false,
        problems: [],
        entries: [],
      },
    };
  }
  const response = await executeRawApiRequest({
    envName: options.target.envName,
    baseUrl: options.target.apiBaseUrl,
    role: options.role,
    token: options.token,
    headers: { 'x-authenticator': options.authenticator },
    method: 'POST',
    path: '/lightExtensions:compileWorkspacePreview',
    body: {
      repoId: checkingState.repo.id,
      expectedHeadCommitId: checkingState.baseHeadCommitId,
      files: options.files,
    },
  });
  if (response.status === 422) {
    const result = extractRejectedWorkspaceCheckResult(response.data);
    const state = await recordRejectedWorkspaceCheck({
      workspaceRoot: options.workspaceRoot,
      state: checkingState,
      files: options.files,
      result,
    });
    return { state, result };
  }
  if (!response.ok) {
    throw buildHttpError(
      response.status,
      response.data,
      translateCli('commands.light.operations.workspaceCheck', undefined, {
        fallback: 'Light Extension workspace check',
      }),
    );
  }
  const result = extractWorkspaceCheckResult(unwrapResponseData(response.data));
  const state = result.accepted
    ? await recordSuccessfulWorkspaceCheck({
        workspaceRoot: options.workspaceRoot,
        state: checkingState,
        files: options.files,
        result,
      })
    : await recordRejectedWorkspaceCheck({
        workspaceRoot: options.workspaceRoot,
        state: checkingState,
        files: options.files,
        result,
      });
  return { state, result };
}

function toProblemOutput(
  problem: LightExtensionProblem,
  result: LightExtensionWorkspaceCheckResult,
  state: LightExtensionWorkspaceState,
) {
  return {
    type: 'problem',
    schemaVersion: 1,
    snapshotId: result.snapshotId,
    contextHash: state.contextHash,
    problem,
  };
}

function rejectedCheckError(result: LightExtensionWorkspaceCheckResult): LightExtensionCliError {
  return new LightExtensionCliError(
    translateCli(
      'commands.light.dev.errors.rejected',
      { snapshotId: result.snapshotId },
      {
        fallback: 'Workspace check rejected snapshot {{snapshotId}}.',
      },
    ),
    { exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected, httpStatus: 422, details: result },
  );
}

function needsAttentionError(state: LightExtensionWorkspaceState): LightExtensionCliError {
  return new LightExtensionCliError(
    translateCli('commands.light.dev.errors.needsAttention', undefined, {
      fallback: 'The finite Agent loop budget was reached and requires attention before continuing.',
    }),
    { exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected, details: state.agentLoop },
  );
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
