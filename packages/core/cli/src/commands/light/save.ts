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
  assertSafeWorkspaceDirectory,
  assertTargetMatchesState,
  assertWorkspaceReadyToSave,
  buildHttpError,
  buildWorkspaceDelta,
  extractSaveResult,
  LightExtensionCliError,
  loadWorkspaceState,
  readWorkspaceFiles,
  recordSuccessfulSave,
  recordWorkspaceAgentLoopEvent,
  resolveLightExtensionTarget,
  unwrapResponseData,
} from '../../lib/light-extension-workspace.js';
import { isInteractiveTerminal } from '../../lib/ui.js';

export default class LightSave extends Command {
  static override summary = translateCli('commands.light.save.summary', undefined, {
    fallback: 'Review and save the checked local Light Extension source delta',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir ./light-demo',
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --message "Fix sales card" --yes',
    '<%= config.bin %> <%= command.id %> --dir ./light-demo --yes --json-output',
  ];

  static override flags = {
    dir: Flags.string({
      description: translateCli('commands.light.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      default: '.',
    }),
    message: Flags.string({
      description: translateCli('commands.light.save.flags.message', undefined, { fallback: 'Source commit message' }),
      default: translateCli('commands.light.save.defaultMessage', undefined, {
        fallback: 'Update Light Extension source',
      }),
    }),
    yes: Flags.boolean({
      char: 'y',
      description: translateCli('commands.light.save.flags.yes', undefined, {
        fallback: 'Confirm saving the displayed source delta',
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
    'json-output': Flags.boolean({
      char: 'j',
      description: translateCli('commands.light.flags.jsonOutput', undefined, {
        fallback: 'Print machine-readable JSON',
      }),
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(LightSave);
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
      const snapshotId = assertWorkspaceReadyToSave(state, files);
      const delta = await buildWorkspaceDelta({ workspaceRoot, state, files });
      if (!delta.files.length)
        throw new LightExtensionCliError(
          translateCli('commands.light.save.errors.noChanges', undefined, {
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
            'commands.light.save.deltaSummary',
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
          throw new LightExtensionCliError(
            translateCli('commands.light.save.errors.confirmationRequired', undefined, {
              fallback: 'Saving requires an interactive confirmation or the explicit --yes flag.',
            }),
          );
        }
        const accepted = await confirm({
          message: translateCli('commands.light.save.confirm', undefined, {
            fallback: 'Save this source delta to the Light Extension repository?',
          }),
          default: false,
        });
        if (!accepted)
          throw new LightExtensionCliError(
            translateCli('commands.light.save.errors.cancelled', undefined, { fallback: 'Save cancelled.' }),
          );
      }

      state = await recordWorkspaceAgentLoopEvent({
        workspaceRoot,
        state,
        files,
        event: { type: 'save_started' },
      });

      let response: Awaited<ReturnType<typeof executeRawApiRequest>>;
      try {
        response = await executeRawApiRequest({
          envName: target.envName,
          baseUrl: target.apiBaseUrl,
          role: flags.role,
          token: flags.token,
          headers: { 'x-authenticator': flags.authenticator },
          method: 'POST',
          path: '/lightExtensionFiles:saveSource',
          body: {
            repoId: state.repo.id,
            expectedHeadCommitId: state.baseHeadCommitId,
            message: flags.message,
            files: delta.files,
          },
        });
      } catch (error: unknown) {
        await recordWorkspaceAgentLoopEvent({
          workspaceRoot,
          state,
          files,
          event: { type: 'save_failed' },
        });
        throw error;
      }
      if (!response.ok) {
        const failure = buildHttpError(
          response.status,
          response.data,
          translateCli('commands.light.operations.save', undefined, { fallback: 'Light Extension save' }),
        );
        if (response.status === 409) {
          await recordWorkspaceAgentLoopEvent({
            workspaceRoot,
            state,
            files,
            event: { type: 'save_conflict' },
          });
          throw new LightExtensionCliError(
            translateCli(
              'commands.light.save.errors.conflict',
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
        await recordWorkspaceAgentLoopEvent({
          workspaceRoot,
          state,
          files,
          event: { type: 'save_failed' },
        });
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
            'commands.light.save.success',
            { count: delta.summary.changedFiles, head: result.commit.id },
            { fallback: 'Saved {{count}} files at Head {{head}}.' },
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
