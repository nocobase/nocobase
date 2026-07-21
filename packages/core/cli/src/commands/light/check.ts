/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { executeRawApiRequest } from '../../lib/api-client.js';
import { translateCli } from '../../lib/cli-locale.js';
import {
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  buildHttpError,
  extractRejectedWorkspaceCheckResult,
  extractWorkspaceCheckResult,
  getFirstError,
  LIGHT_EXTENSION_EXIT_CODES,
  LightExtensionCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordRejectedWorkspaceCheck,
  recordSuccessfulWorkspaceCheck,
  recordWorkspaceAgentLoopEvent,
  resolveLightExtensionTarget,
  unwrapResponseData,
  type LightExtensionWorkspaceCheckResult,
} from '../../lib/light-extension-workspace.js';

function formatProblems(result: LightExtensionWorkspaceCheckResult): string {
  if (!result.problems.length)
    return translateCli('commands.light.check.noProblems', undefined, { fallback: 'No Problems.' });
  return result.problems
    .map((problem) => {
      const location = problem.path
        ? `${problem.path}${problem.range ? `:${problem.range.start.line}:${problem.range.start.column}` : ''}`
        : translateCli('commands.light.check.workspaceLocation', undefined, { fallback: 'workspace' });
      return `${problem.severity.toUpperCase()} ${problem.code} ${location} ${problem.message}`;
    })
    .join('\n');
}

export default class LightCheck extends Command {
  static override summary = translateCli('commands.light.check.summary', undefined, {
    fallback: 'Run the authoritative check for a complete local Light Extension workspace',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./light-demo',
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --json-output',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.light.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
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
    'json-output': Flags.boolean({
      char: 'j',
      description: translateCli('commands.light.flags.jsonOutput', undefined, {
        fallback: 'Print machine-readable JSON',
      }),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LightCheck);
    const jsonOutput = flags['json-output'];

    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      let state = await loadWorkspaceState(workspaceRoot);
      const target = await resolveLightExtensionTarget({
        env: flags.env ?? state.env.name,
        apiBaseUrl: flags['api-base-url'] ?? state.app.apiBaseUrl,
      });
      assertTargetMatchesState(target, state);
      const files = await readWorkspaceFiles(workspaceRoot, state);
      state = await recordWorkspaceAgentLoopEvent({
        workspaceRoot,
        state,
        files,
        event: { type: 'check_started' },
      });
      const response = await executeRawApiRequest({
        envName: target.envName,
        baseUrl: target.apiBaseUrl,
        role: flags.role,
        token: flags.token,
        headers: { 'x-authenticator': flags.authenticator },
        method: 'POST',
        path: '/lightExtensions:compileWorkspacePreview',
        body: {
          repoId: state.repo.id,
          expectedHeadCommitId: state.baseHeadCommitId,
          files,
        },
      });

      if (response.status === 422) {
        const result = extractRejectedWorkspaceCheckResult(response.data);
        await recordRejectedWorkspaceCheck({ workspaceRoot, state, files, result });
        const output = {
          ok: false,
          httpStatus: 422,
          error: getFirstError(response.data),
          check: result,
        };
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.check.errors.rejected',
            { snapshotId: result.snapshotId, problems: formatProblems(result) },
            { fallback: 'Workspace check rejected snapshot {{snapshotId}}.\n{{problems}}' },
          ),
          {
            exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected,
            httpStatus: 422,
            details: result,
            jsonOutput: output,
          },
        );
      }
      if (!response.ok)
        throw buildHttpError(
          response.status,
          response.data,
          translateCli('commands.light.operations.workspaceCheck', undefined, {
            fallback: 'Light Extension workspace check',
          }),
        );

      const result = extractWorkspaceCheckResult(unwrapResponseData(response.data));
      if (!result.accepted) {
        await recordRejectedWorkspaceCheck({ workspaceRoot, state, files, result });
        const output = { ok: false, httpStatus: response.status, check: result };
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.check.errors.notAccepted',
            { snapshotId: result.snapshotId, problems: formatProblems(result) },
            { fallback: 'Workspace check did not accept snapshot {{snapshotId}}.\n{{problems}}' },
          ),
          {
            exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected,
            httpStatus: response.status,
            details: result,
            jsonOutput: output,
          },
        );
      }
      await recordSuccessfulWorkspaceCheck({ workspaceRoot, state, files, result });
      const output = { ok: true, httpStatus: response.status, check: result };
      if (jsonOutput) this.log(JSON.stringify(output, null, 2));
      else {
        this.log(
          translateCli(
            'commands.light.check.success',
            { snapshotId: result.snapshotId },
            {
              fallback: 'Workspace check accepted snapshot {{snapshotId}}.',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.light.check.baseHead',
            { head: result.baseHeadCommitId ?? 'null' },
            {
              fallback: 'Base Head: {{head}}',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.light.check.entriesAccepted',
            { count: result.entries.length },
            {
              fallback: '{{count}} entries accepted.',
            },
          ),
        );
      }
    } catch (error: unknown) {
      const failure =
        error instanceof LightExtensionCliError
          ? error
          : new LightExtensionCliError(error instanceof Error ? error.message : String(error), { cause: error });
      if (jsonOutput) this.logToStderr(JSON.stringify(failure.toJSON(), null, 2));
      else this.logToStderr(failure.message);
      this.exit(failure.exitCode);
    }
  }
}
