/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  decodeLightExtensionPreviewSessionDescriptor,
  type LightExtensionPreviewProblemSessionState,
} from '@nocobase/light-extension-sdk/agent-loop';
import { executeRawApiRequest } from '../../lib/api-client.js';
import { translateCli } from '../../lib/cli-locale.js';
import {
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  buildHttpError,
  buildWorkspaceSnapshotId,
  LIGHT_EXTENSION_EXIT_CODES,
  LightExtensionCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordWorkspaceAgentLoopEvent,
  resolveLightExtensionTarget,
  unwrapResponseData,
  type LightExtensionProblem,
  type LightExtensionWorkspaceState,
} from '../../lib/light-extension-workspace.js';

interface PreviewProblemItem {
  cursor: number;
  problem: LightExtensionProblem;
}

interface PreviewProblemSessionResult {
  sessionId: string;
  snapshotId: string;
  artifactHash: string;
  executionId: string;
  state: LightExtensionPreviewProblemSessionState;
  nextCursor: number;
  items: PreviewProblemItem[];
}

export default class LightProblems extends Command {
  static override summary = translateCli('commands.light.problems.summary', undefined, {
    fallback: 'Follow the current manual Host Preview problem session as JSONL',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --follow <session-token>',
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --follow <session-token> --once',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.light.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
    }),
    follow: Flags.string({
      description: translateCli('commands.light.problems.flags.follow', undefined, {
        fallback: 'Preview session token copied from the NocoBase workspace',
      }),
      required: true,
    }),
    'poll-interval': Flags.integer({
      description: translateCli('commands.light.problems.flags.pollInterval', undefined, {
        fallback: 'Polling interval in milliseconds',
      }),
      default: 1000,
      min: 100,
      max: 30000,
    }),
    'timeout-ms': Flags.integer({
      description: translateCli('commands.light.problems.flags.timeoutMs', undefined, {
        fallback: 'Maximum follow duration in milliseconds',
      }),
      default: 10 * 60 * 1000,
      min: 1000,
    }),
    once: Flags.boolean({
      description: translateCli('commands.light.problems.flags.once', undefined, {
        fallback: 'Poll once instead of following until the session closes',
      }),
      default: false,
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
    const { flags } = await this.parse(LightProblems);
    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      let state = await loadWorkspaceState(workspaceRoot);
      const target = await resolveLightExtensionTarget({
        env: flags.env ?? state.env.name,
        apiBaseUrl: flags['api-base-url'] ?? state.app.apiBaseUrl,
      });
      assertTargetMatchesState(target, state);
      const descriptor = decodeLightExtensionPreviewSessionDescriptor(flags.follow);
      let files = await readWorkspaceFiles(workspaceRoot, state);
      state = await synchronizeAgentSnapshot(workspaceRoot, state, files);
      assertDescriptorMatchesWorkspace(descriptor, state, files);
      if (!state.agentLoop) {
        throw new LightExtensionCliError(
          translateCli('commands.light.errors.agentLoopMissing', undefined, {
            fallback: 'The local Agent loop state is missing. Run `nb light check` before following Preview Problems.',
          }),
        );
      }
      if (!state.agentLoop.preview || state.agentLoop.preview.sessionId !== descriptor.sessionId) {
        state = await recordWorkspaceAgentLoopEvent({
          workspaceRoot,
          state,
          files,
          event: {
            type: 'preview_opened',
            sessionId: descriptor.sessionId,
            snapshotId: descriptor.snapshotId,
            contextHash: descriptor.contextHash,
          },
        });
      }

      const startedAt = Date.now();
      let cursor = state.agentLoop.preview?.cursor || 0;
      for (;;) {
        files = await readWorkspaceFiles(workspaceRoot, state);
        state = await synchronizeAgentSnapshot(workspaceRoot, state, files);
        assertDescriptorMatchesWorkspace(descriptor, state, files);
        const response = await executeRawApiRequest({
          envName: target.envName,
          baseUrl: target.apiBaseUrl,
          role: flags.role,
          token: flags.token,
          headers: { 'x-authenticator': flags.authenticator },
          method: 'POST',
          path: '/lightExtensionPreviewProblems:watch',
          body: {
            sessionId: descriptor.sessionId,
            repoId: descriptor.repoId,
            entryId: descriptor.entryId,
            ownerLocator: descriptor.ownerLocator,
            snapshotId: descriptor.snapshotId,
            artifactHash: descriptor.artifactHash,
            executionId: descriptor.executionId,
            cursor,
          },
        });
        if (!response.ok) {
          throw buildHttpError(
            response.status,
            response.data,
            translateCli('commands.light.operations.previewProblems', undefined, {
              fallback: 'Light Extension preview problem follow',
            }),
          );
        }
        const result = extractPreviewProblemSessionResult(unwrapResponseData(response.data));
        assertSessionMatchesDescriptor(result, descriptor);
        const problems = result.items
          .map((item) => item.problem)
          .filter((problem) => {
            return problem.snapshotId === descriptor.snapshotId && problem.requestId === descriptor.executionId;
          });
        for (const item of result.items) {
          if (item.problem.snapshotId !== descriptor.snapshotId || item.problem.requestId !== descriptor.executionId) {
            continue;
          }
          this.log(
            JSON.stringify({
              type: 'problem',
              schemaVersion: 1,
              sessionId: descriptor.sessionId,
              snapshotId: descriptor.snapshotId,
              contextHash: descriptor.contextHash,
              cursor: item.cursor,
              problem: item.problem,
            }),
          );
        }
        state = await recordWorkspaceAgentLoopEvent({
          workspaceRoot,
          state,
          files,
          event: {
            type: 'preview_polled',
            sessionId: descriptor.sessionId,
            cursor: result.nextCursor,
            state: result.state,
            snapshotId: descriptor.snapshotId,
            contextHash: descriptor.contextHash,
            problems,
          },
        });
        cursor = result.nextCursor;
        this.log(
          JSON.stringify({
            type: 'state',
            schemaVersion: 1,
            sessionId: descriptor.sessionId,
            snapshotId: descriptor.snapshotId,
            contextHash: descriptor.contextHash,
            cursor,
            previewState: result.state,
            agentState: state.agentLoop?.status,
          }),
        );

        if (flags.once || result.state !== 'active') {
          break;
        }
        if (Date.now() - startedAt >= flags['timeout-ms']) {
          throw new LightExtensionCliError(
            translateCli('commands.light.problems.errors.timeout', undefined, {
              fallback: 'Timed out while following the Preview Problem session.',
            }),
          );
        }
        await delay(flags['poll-interval']);
      }

      if (state.agentLoop?.status === 'runtime_failed') {
        throw new LightExtensionCliError(
          translateCli('commands.light.problems.errors.runtimeFailed', undefined, {
            fallback: 'The manual Host Preview reported runtime errors. Fix the local source and run check again.',
          }),
          { exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected, details: state.agentLoop.problems },
        );
      }
      if (state.agentLoop?.preview?.state === 'stale' || state.agentLoop?.preview?.state === 'expired') {
        throw new LightExtensionCliError(
          translateCli('commands.light.problems.errors.sessionClosed', undefined, {
            fallback: 'The Preview Problem session became stale or expired before it was completed.',
          }),
          { exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected, details: state.agentLoop.preview },
        );
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

async function synchronizeAgentSnapshot(
  workspaceRoot: string,
  state: LightExtensionWorkspaceState,
  files: Awaited<ReturnType<typeof readWorkspaceFiles>>,
): Promise<LightExtensionWorkspaceState> {
  const snapshotId = buildWorkspaceSnapshotId(files);
  if (!state.agentLoop || state.agentLoop.snapshotId === snapshotId) {
    return state;
  }
  return recordWorkspaceAgentLoopEvent({
    workspaceRoot,
    state,
    files,
    event: {
      type: 'local_changed',
      snapshotId,
      contextHash: state.contextHash,
    },
  });
}

function assertDescriptorMatchesWorkspace(
  descriptor: ReturnType<typeof decodeLightExtensionPreviewSessionDescriptor>,
  state: LightExtensionWorkspaceState,
  files: Awaited<ReturnType<typeof readWorkspaceFiles>>,
): void {
  const snapshotId = buildWorkspaceSnapshotId(files);
  if (
    descriptor.repoId !== state.repo.id ||
    descriptor.entryId !== state.entry.id ||
    descriptor.snapshotId !== snapshotId ||
    descriptor.contextHash !== state.contextHash
  ) {
    throw new LightExtensionCliError(
      translateCli('commands.light.problems.errors.sessionMismatch', undefined, {
        fallback:
          'The Preview session does not match the current local repository, entry, snapshot, or Context Pack hash.',
      }),
      {
        details: {
          session: descriptor,
          workspace: {
            repoId: state.repo.id,
            entryId: state.entry.id,
            snapshotId,
            contextHash: state.contextHash,
          },
        },
      },
    );
  }
}

function extractPreviewProblemSessionResult(value: unknown): PreviewProblemSessionResult {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.problems.errors.invalidResponse', undefined, {
        fallback: 'Invalid Preview Problem session response.',
      }),
    );
  }
  const states: LightExtensionPreviewProblemSessionState[] = ['active', 'completed', 'stale', 'expired'];
  if (typeof value.state !== 'string' || !states.includes(value.state as LightExtensionPreviewProblemSessionState)) {
    throw new LightExtensionCliError(
      translateCli('commands.light.problems.errors.invalidState', undefined, {
        fallback: 'Invalid Preview Problem session state.',
      }),
    );
  }
  return {
    sessionId: requireString(value.sessionId, 'sessionId'),
    snapshotId: requireString(value.snapshotId, 'snapshotId'),
    artifactHash: requireString(value.artifactHash, 'artifactHash'),
    executionId: requireString(value.executionId, 'executionId'),
    state: value.state as LightExtensionPreviewProblemSessionState,
    nextCursor: requireCursor(value.nextCursor),
    items: value.items.map((item) => {
      if (!isRecord(item) || !isRecord(item.problem)) {
        throw new LightExtensionCliError(
          translateCli('commands.light.problems.errors.invalidItem', undefined, {
            fallback: 'Invalid Preview Problem session item.',
          }),
        );
      }
      return { cursor: requireCursor(item.cursor), problem: item.problem as unknown as LightExtensionProblem };
    }),
  };
}

function assertSessionMatchesDescriptor(
  result: PreviewProblemSessionResult,
  descriptor: ReturnType<typeof decodeLightExtensionPreviewSessionDescriptor>,
): void {
  if (
    result.sessionId !== descriptor.sessionId ||
    result.snapshotId !== descriptor.snapshotId ||
    result.artifactHash !== descriptor.artifactHash ||
    result.executionId !== descriptor.executionId
  ) {
    throw new LightExtensionCliError(
      translateCli('commands.light.problems.errors.identityMismatch', undefined, {
        fallback: 'Preview Problem session response identity mismatch.',
      }),
    );
  }
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new LightExtensionCliError(
      translateCli(
        'commands.light.problems.errors.invalidField',
        { label },
        {
          fallback: 'Invalid Preview Problem {{label}}.',
        },
      ),
    );
  }
  return value;
}

function requireCursor(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new LightExtensionCliError(
      translateCli('commands.light.problems.errors.invalidCursor', undefined, {
        fallback: 'Invalid Preview Problem cursor.',
      }),
    );
  }
  return Math.trunc(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function delay(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}
