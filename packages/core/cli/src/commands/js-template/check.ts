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
  JS_TEMPLATE_WORKSPACE_API_PATHS,
  type JsTemplateWorkspaceApiPaths,
} from '../../lib/js-template-command-contract.js';
import {
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  buildHttpError,
  buildWorkspaceSnapshotId,
  extractRejectedWorkspaceCheckResult,
  extractWorkspaceCheckResult,
  getFirstError,
  JS_TEMPLATE_EXIT_CODES,
  JsTemplateCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordSuccessfulWorkspaceCheck,
  resolveJsTemplateTarget,
  unwrapResponseData,
  type JsTemplateWorkspaceCheckResult,
} from '../../lib/js-template-workspace.js';

function formatDiagnostics(result: JsTemplateWorkspaceCheckResult): string {
  if (!result.diagnostics.length)
    return translateCli('commands.jsTemplate.check.noProblems', undefined, { fallback: 'No diagnostics.' });
  return result.diagnostics
    .map((diagnostic) => {
      const location = diagnostic.path
        ? `${diagnostic.path}${diagnostic.line ? `:${diagnostic.line}:${diagnostic.column || 1}` : ''}`
        : translateCli('commands.jsTemplate.check.workspaceLocation', undefined, { fallback: 'workspace' });
      return `${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${location} ${diagnostic.message}`;
    })
    .join('\n');
}

export default class JsTemplateCheck extends Command {
  protected apiPaths: JsTemplateWorkspaceApiPaths = JS_TEMPLATE_WORKSPACE_API_PATHS;

  static override summary = translateCli('commands.jsTemplate.check.summary', undefined, {
    fallback: 'Run the authoritative check for a complete local JS Template workspace',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./js-template-demo',
    '<%= config.bin %> <%= command.id %> --dir ./js-template-demo --json-output',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.jsTemplate.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
    }),
    env: Flags.string({
      char: 'e',
      description: translateCli('commands.jsTemplate.flags.env', undefined, { fallback: 'Environment name' }),
    }),
    'api-base-url': Flags.string({
      description: translateCli('commands.jsTemplate.flags.apiBaseUrl', undefined, { fallback: 'NocoBase API base URL' }),
    }),
    role: Flags.string({
      description: translateCli('commands.jsTemplate.flags.role', undefined, { fallback: 'Role override, sent as X-Role' }),
    }),
    authenticator: Flags.string({
      description: translateCli('commands.jsTemplate.flags.authenticator', undefined, {
        fallback: 'Authenticator override, sent as X-Authenticator',
      }),
    }),
    token: Flags.string({
      char: 't',
      description: translateCli('commands.jsTemplate.flags.token', undefined, { fallback: 'API key override' }),
    }),
    'json-output': Flags.boolean({
      char: 'j',
      description: translateCli('commands.jsTemplate.flags.jsonOutput', undefined, {
        fallback: 'Print machine-readable JSON',
      }),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(JsTemplateCheck);
    const jsonOutput = flags['json-output'];

    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      const state = await loadWorkspaceState(workspaceRoot);
      const target = await resolveJsTemplateTarget({
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
        path: this.apiPaths.compileWorkspacePreview,
        body: {
          projectId: state.project.id,
          expectedHeadCommitId: state.baseHeadCommitId,
          files,
        },
      });

      if (response.status === 422) {
        const result = extractRejectedWorkspaceCheckResult(response.data);
        const output = {
          ok: false,
          httpStatus: 422,
          exitCode: JS_TEMPLATE_EXIT_CODES.rejected,
          error: getFirstError(response.data),
          check: result,
        };
        throw new JsTemplateCliError(
          translateCli(
            'commands.jsTemplate.check.errors.rejected',
            { snapshotId, problems: formatDiagnostics(result) },
            { fallback: 'Workspace check rejected snapshot {{snapshotId}}.\n{{problems}}' },
          ),
          {
            exitCode: JS_TEMPLATE_EXIT_CODES.rejected,
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
          translateCli('commands.jsTemplate.operations.workspaceCheck', undefined, {
            fallback: 'JS Template workspace check',
          }),
        );

      const result = extractWorkspaceCheckResult(unwrapResponseData(response.data));
      if (!result.accepted) {
        const output = {
          ok: false,
          httpStatus: response.status,
          exitCode: JS_TEMPLATE_EXIT_CODES.rejected,
          check: result,
        };
        throw new JsTemplateCliError(
          translateCli(
            'commands.jsTemplate.check.errors.notAccepted',
            { snapshotId, problems: formatDiagnostics(result) },
            { fallback: 'Workspace check did not accept snapshot {{snapshotId}}.\n{{problems}}' },
          ),
          {
            exitCode: JS_TEMPLATE_EXIT_CODES.rejected,
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
            'commands.jsTemplate.check.success',
            { snapshotId },
            {
              fallback: 'Workspace check accepted snapshot {{snapshotId}}.',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.jsTemplate.check.baseHead',
            { head: state.baseHeadCommitId ?? 'null' },
            {
              fallback: 'Base Head: {{head}}',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.jsTemplate.check.templatesAccepted',
            { count: result.templates?.length || 0 },
            {
              fallback: '{{count}} templates accepted.',
            },
          ),
        );
      }
    } catch (error: unknown) {
      const failure =
        error instanceof JsTemplateCliError
          ? error
          : new JsTemplateCliError(error instanceof Error ? error.message : String(error), { cause: error });
      if (jsonOutput) this.logToStderr(JSON.stringify(failure.toJSON(), null, 2));
      else this.logToStderr(failure.message);
      this.exit(failure.exitCode);
    }
  }
}
