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
  buildWorkspaceSnapshotId,
  extractRejectedWorkspaceCheckResult,
  extractWorkspaceCheckResult,
  getFirstError,
  LIGHT_EXTENSION_EXIT_CODES,
  LightExtensionCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordSuccessfulWorkspaceCheck,
  resolveLightExtensionTarget,
  unwrapResponseData,
  type LightExtensionWorkspaceCheckResult,
} from '../../lib/light-extension-workspace.js';

function formatDiagnostics(result: LightExtensionWorkspaceCheckResult): string {
  if (!result.diagnostics.length)
    return translateCli('commands.light.check.noProblems', undefined, { fallback: 'No diagnostics.' });
  return result.diagnostics
    .map((diagnostic) => {
      const location = diagnostic.path
        ? `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}:${diagnostic.column || 1}` : ''}`
        : translateCli('commands.light.check.workspaceLocation', undefined, { fallback: 'workspace' });
      return `${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${location} ${diagnostic.message}`;
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
      const state = await loadWorkspaceState(workspaceRoot);
      const target = await resolveLightExtensionTarget({
        env: flags.env ?? state.env.name,
        apiBaseUrl: flags['api-base-url'] ?? state.app.apiBaseUrl,
      });
      assertTargetMatchesState(target, state);
      const files = await readWorkspaceFiles(workspaceRoot, state);
      const snapshotId = buildWorkspaceSnapshotId(files);
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
        const output = {
          ok: false,
          httpStatus: 422,
          exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected,
          error: getFirstError(response.data),
          check: result,
        };
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.check.errors.rejected',
            { snapshotId, problems: formatDiagnostics(result) },
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
        const output = {
          ok: false,
          httpStatus: response.status,
          exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected,
          check: result,
        };
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.check.errors.notAccepted',
            { snapshotId, problems: formatDiagnostics(result) },
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
      await recordSuccessfulWorkspaceCheck({ workspaceRoot, state, files });
      const output = { ok: true, httpStatus: response.status, snapshotId, check: result };
      if (jsonOutput) this.log(JSON.stringify(output, null, 2));
      else {
        this.log(
          translateCli(
            'commands.light.check.success',
            { snapshotId },
            {
              fallback: 'Workspace check accepted snapshot {{snapshotId}}.',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.light.check.baseHead',
            { head: state.baseHeadCommitId ?? 'null' },
            {
              fallback: 'Base Head: {{head}}',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.light.check.entriesAccepted',
            { count: result.entries?.length || 0 },
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
