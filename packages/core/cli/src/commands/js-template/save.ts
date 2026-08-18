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
import { confirm } from '../../lib/inquirer.js';
import {
  JS_TEMPLATE_WORKSPACE_API_PATHS,
  type JsTemplateWorkspaceApiPaths,
} from '../../lib/js-template-command-contract.js';
import {
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  assertWorkspaceReadyToSave,
  buildHttpError,
  buildWorkspaceDelta,
  extractSaveResult,
  JsTemplateCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordSuccessfulSave,
  resolveJsTemplateTarget,
  unwrapResponseData,
} from '../../lib/js-template-workspace.js';
import { isInteractiveTerminal } from '../../lib/ui.js';

export default class JsTemplateSave extends Command {
  protected apiPaths: JsTemplateWorkspaceApiPaths = JS_TEMPLATE_WORKSPACE_API_PATHS;

  static override summary = translateCli('commands.jsTemplate.save.summary', undefined, {
    fallback: 'Review and save the checked local JS Template source delta',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./js-template-demo',
    '<%= config.bin %> <%= command.id %> --dir ./js-template-demo --message "Fix sales card" --yes',
    '<%= config.bin %> <%= command.id %> --dir ./js-template-demo --yes --json-output',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.jsTemplate.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
    }),
    message: Flags.string({
      description: translateCli('commands.jsTemplate.save.flags.message', undefined, { fallback: 'Source commit message' }),
      default: translateCli('commands.jsTemplate.save.defaultMessage', undefined, {
        fallback: 'Update JS Template source',
      }),
    }),
    yes: Flags.boolean({
      char: 'y',
      description: translateCli('commands.jsTemplate.save.flags.yes', undefined, {
        fallback: 'Confirm saving the displayed source delta',
      }),
      default: false,
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
    const { flags } = await this.parse(JsTemplateSave);
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
      const snapshotId = assertWorkspaceReadyToSave(state, files);
      const delta = await buildWorkspaceDelta({ workspaceRoot, state, files });
      if (!delta.files.length)
        throw new JsTemplateCliError(
          translateCli('commands.jsTemplate.save.errors.noChanges', undefined, {
            fallback: 'There are no local source changes to save.',
          }),
        );

      const review = {
        snapshotId,
        baseHeadCommitId: state.baseHeadCommitId,
        delta: delta.summary,
        diff: delta.diff,
      };
      if (jsonOutput) {
        this.logToStderr(JSON.stringify({ ok: true, stage: 'review', review }, null, 2));
      } else {
        this.log(
          translateCli(
            'commands.jsTemplate.save.deltaSummary',
            {
              changedFiles: delta.summary.changedFiles,
              additions: delta.summary.additions,
              deletions: delta.summary.deletions,
            },
            { fallback: 'Delta: {{changedFiles}} files, {{additions}} additions, {{deletions}} deletions.' },
          ),
        );
        this.log(delta.diff);
      }
      if (!flags.yes) {
        if (!isInteractiveTerminal()) {
          throw new JsTemplateCliError(
            translateCli('commands.jsTemplate.save.errors.confirmationRequired', undefined, {
              fallback: 'Saving requires an interactive confirmation or the explicit --yes flag.',
            }),
          );
        }
        const accepted = await confirm({
          message: translateCli('commands.jsTemplate.save.confirm', undefined, {
            fallback: 'Save this source delta to the JS Template project?',
          }),
          default: false,
        });
        if (!accepted)
          throw new JsTemplateCliError(
            translateCli('commands.jsTemplate.save.errors.cancelled', undefined, { fallback: 'Save cancelled.' }),
          );
      }

      const response = await executeRawApiRequest({
        envName: target.envName,
        baseUrl: target.apiBaseUrl,
        role: flags.role,
        token: flags.token,
        headers: { 'x-authenticator': flags.authenticator },
        method: 'POST',
        path: this.apiPaths.filesSaveSource,
        body: {
          projectId: state.project.id,
          expectedHeadCommitId: state.baseHeadCommitId,
          message: flags.message,
          files: delta.files,
        },
      });
      if (!response.ok) {
        const failure = buildHttpError(
          response.status,
          response.data,
          translateCli('commands.jsTemplate.operations.save', undefined, { fallback: 'JS Template save' }),
        );
        if (response.status === 409) {
          throw new JsTemplateCliError(
            translateCli(
              'commands.jsTemplate.save.errors.conflict',
              { message: failure.message },
              {
                fallback:
                  '{{message}} Local files and the Pull baseline were kept unchanged. Pull the new Head and replay this patch; the CLI will not retry with a replaced Head.',
              },
            ),
            {
              exitCode: failure.exitCode,
              httpStatus: failure.httpStatus,
              details: { response: response.data, snapshotId, delta: delta.summary },
            },
          );
        }
        throw failure;
      }
      const result = extractSaveResult(unwrapResponseData(response.data));
      await recordSuccessfulSave({ workspaceRoot, state, files, result });
      const output = {
        ok: true,
        httpStatus: response.status,
        snapshotId,
        baseHeadCommitId: state.baseHeadCommitId,
        newHeadCommitId: result.commit.id,
        delta: delta.summary,
        review,
        result,
      };
      if (jsonOutput) this.log(JSON.stringify(output, null, 2));
      else {
        this.log(
          translateCli(
            'commands.jsTemplate.save.success',
            { count: delta.summary.changedFiles, head: result.commit.id },
            { fallback: 'Saved {{count}} files at Head {{head}}.' },
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
