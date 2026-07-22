/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import * as lightExtensionTypegenModule from '@nocobase/light-extension-sdk/typegen';
import { executeRawApiRequest } from '../../lib/api-client.js';
import { translateCli } from '../../lib/cli-locale.js';
import {
  assertSafeWorkspaceDirectory,
  assertPullSupportedByLocalWorkspace,
  backupAndClearPullTarget,
  buildHttpError,
  extractContextPack,
  extractEntryRecord,
  extractPullResult,
  inspectPullTarget,
  LightExtensionCliError,
  materializePulledWorkspace,
  parseOwnerLocatorFlag,
  resolveLightExtensionTarget,
  unwrapResponseData,
} from '../../lib/light-extension-workspace.js';

type LightExtensionTypegenModule = typeof import('@nocobase/light-extension-sdk/typegen');
const lightExtensionTypegenRuntime = lightExtensionTypegenModule as LightExtensionTypegenModule & {
  default?: LightExtensionTypegenModule;
};
const { createActiveEntryContextType, generateBindingContextTypes, generateClientSettingsTypes } =
  lightExtensionTypegenRuntime.default || lightExtensionTypegenRuntime;

export default class LightPull extends Command {
  static override summary = translateCli('commands.light.pull.summary', undefined, {
    fallback: 'Pull a JS Block or JS Page into a local source workspace',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --repo ler_demo --entry lee_demo --dir ./light-demo',
    '<%= config.bin %> <%= command.id %> --repo ler_demo --entry lee_demo --dir ./light-demo --force',
    '<%= config.bin %> <%= command.id %> --repo ler_demo --entry lee_demo --dir ./light-demo --json-output',
  ];

  static override flags = {
    repo: Flags.string({
      description: translateCli('commands.light.flags.repo', undefined, { fallback: 'Light Extension repository id' }),
      required: true,
    }),
    entry: Flags.string({
      description: translateCli('commands.light.flags.entry', undefined, { fallback: 'JS Block or JS Page entry id' }),
      required: true,
    }),
    dir: Flags.string({
      description: translateCli('commands.light.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      required: true,
    }),
    force: Flags.boolean({
      description: translateCli('commands.light.pull.flags.force', undefined, {
        fallback: 'Back up and replace local source changes in the target directory',
      }),
      default: false,
    }),
    reference: Flags.string({
      description: translateCli('commands.light.pull.flags.reference', undefined, {
        fallback: 'Explicit Light Extension reference id for binding-aware types',
      }),
    }),
    'owner-locator': Flags.string({
      description: translateCli('commands.light.pull.flags.ownerLocator', undefined, {
        fallback: 'Explicit binding owner locator as a JSON object',
      }),
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
    const { flags } = await this.parse(LightPull);
    const jsonOutput = flags['json-output'];
    let backupPath: string | undefined;

    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      if (flags.reference && flags['owner-locator']) {
        throw new LightExtensionCliError(
          translateCli('commands.light.pull.errors.bindingFlagsConflict', undefined, {
            fallback: 'Use either --reference or --owner-locator, not both.',
          }),
        );
      }
      const ownerLocator = parseOwnerLocatorFlag(flags['owner-locator']);
      const inspection = await inspectPullTarget(workspaceRoot);
      if (inspection.dirty && !flags.force) {
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.pull.dirtyRefusal',
            {
              paths:
                inspection.changedPaths.join(', ') ||
                inspection.stateError ||
                translateCli('commands.light.pull.unknownLocalState', undefined, { fallback: 'unknown local state' }),
            },
            {
              fallback:
                'The target directory has local source changes ({{paths}}). Re-run with --force to back them up before pulling.',
            },
          ),
          { details: { changedPaths: inspection.changedPaths, stateError: inspection.stateError } },
        );
      }

      const target = await resolveLightExtensionTarget({
        env: flags.env,
        apiBaseUrl: flags['api-base-url'],
      });
      const requestOptions = {
        envName: target.envName,
        baseUrl: target.apiBaseUrl,
        role: flags.role,
        token: flags.token,
        headers: { 'x-authenticator': flags.authenticator },
      };
      const entryResponse = await executeRawApiRequest({
        ...requestOptions,
        method: 'POST',
        path: '/lightExtensionEntries:get',
        body: { entryId: flags.entry },
      });
      if (!entryResponse.ok)
        throw buildHttpError(
          entryResponse.status,
          entryResponse.data,
          translateCli('commands.light.operations.entryRead', undefined, { fallback: 'Light Extension entry read' }),
        );
      const entry = extractEntryRecord(unwrapResponseData(entryResponse.data));
      if (entry.repoId !== flags.repo) {
        throw new LightExtensionCliError(
          translateCli(
            'commands.light.pull.errors.entryRepoMismatch',
            { entry: flags.entry, actualRepo: entry.repoId, selectedRepo: flags.repo },
            { fallback: 'Entry "{{entry}}" belongs to repository "{{actualRepo}}", not "{{selectedRepo}}".' },
          ),
        );
      }

      const pullResponse = await executeRawApiRequest({
        ...requestOptions,
        method: 'POST',
        path: '/lightExtensionFiles:pull',
        body: { repoId: flags.repo, ref: 'head', includeContent: 'all' },
      });
      if (!pullResponse.ok)
        throw buildHttpError(
          pullResponse.status,
          pullResponse.data,
          translateCli('commands.light.operations.pull', undefined, { fallback: 'Light Extension pull' }),
        );
      const pull = extractPullResult(unwrapResponseData(pullResponse.data));
      assertPullSupportedByLocalWorkspace(pull);
      const contextResponse = await executeRawApiRequest({
        ...requestOptions,
        method: 'POST',
        path: '/lightExtensionContexts:get',
        body: {
          repoId: flags.repo,
          entryId: flags.entry,
          ...(flags.reference ? { referenceId: flags.reference } : {}),
          ...(ownerLocator ? { ownerLocator } : {}),
        },
      });
      if (!contextResponse.ok) {
        throw buildHttpError(
          contextResponse.status,
          contextResponse.data,
          translateCli('commands.light.operations.contextRead', undefined, {
            fallback: 'Light Extension Context Pack read',
          }),
        );
      }
      const contextPack = extractContextPack(unwrapResponseData(contextResponse.data));
      if (contextPack.repoId !== flags.repo || contextPack.entry.id !== flags.entry) {
        throw new LightExtensionCliError(
          translateCli('commands.light.pull.errors.contextMismatch', undefined, {
            fallback: 'The Context Pack does not match the selected repository and entry.',
          }),
        );
      }
      const sourceFiles = (pull.files || []).map((file) => ({ path: file.path, content: file.content || '' }));
      const settingsTypes = generateClientSettingsTypes({ files: sourceFiles });
      const bindingTypes = generateBindingContextTypes(contextPack);
      const activeEntryContext = createActiveEntryContextType({
        activePath: entry.entryPath,
        bindingTypes,
        entries: settingsTypes.entries,
      });
      const generatedTypeFiles = [
        ...settingsTypes.files,
        ...bindingTypes.files,
        ...(activeEntryContext.file ? [activeEntryContext.file] : []),
      ];

      const latestInspection = await inspectPullTarget(workspaceRoot);
      if (latestInspection.dirty && !flags.force) {
        throw new LightExtensionCliError(
          translateCli('commands.light.pull.errors.changedDuringPull', undefined, {
            fallback:
              'The target directory changed while the pull request was running. Re-run the command after reviewing the local files, or use --force to back them up.',
          }),
          { details: { changedPaths: latestInspection.changedPaths, stateError: latestInspection.stateError } },
        );
      }
      if (latestInspection.dirty && !jsonOutput) {
        this.log(
          translateCli(
            'commands.light.pull.overwriteWarning',
            {
              paths:
                latestInspection.changedPaths.join(', ') ||
                translateCli('commands.light.pull.localWorkspaceFiles', undefined, {
                  fallback: 'local workspace files',
                }),
            },
            { fallback: 'Local changes will be backed up before replacement: {{paths}}' },
          ),
        );
      }
      backupPath = flags.force
        ? await backupAndClearPullTarget(workspaceRoot, latestInspection, {
            onBackupReady: (path) => {
              backupPath = path;
              const announcement = translateCli(
                'commands.light.pull.backup',
                { path },
                { fallback: 'Backup: {{path}}' },
              );
              if (jsonOutput) {
                this.logToStderr(JSON.stringify({ ok: true, stage: 'backup', backupPath: path }, null, 2));
              } else {
                this.log(announcement);
              }
            },
          })
        : undefined;
      const state = await materializePulledWorkspace({
        workspaceRoot,
        target,
        repoId: flags.repo,
        entry,
        pull,
        contextHash: contextPack.contextHash,
        contextReferenceId: contextPack.binding?.referenceId,
        generatedTypeFiles,
        previousState: backupPath ? undefined : latestInspection.state,
      });

      const output = {
        ok: true,
        workspace: workspaceRoot,
        repo: state.repo,
        entry: state.entry,
        baseHeadCommitId: state.baseHeadCommitId,
        treeHash: state.treeHash,
        files: Object.keys(state.files),
        context: {
          contextHash: contextPack.contextHash,
          mode: contextPack.contextMode,
          reason: contextPack.reason,
        },
        ...(backupPath ? { backupPath } : {}),
      };
      if (jsonOutput) {
        this.log(JSON.stringify(output, null, 2));
      } else {
        this.log(
          translateCli(
            'commands.light.pull.success',
            { count: Object.keys(state.files).length, workspace: workspaceRoot },
            { fallback: 'Pulled {{count}} files into {{workspace}}.' },
          ),
        );
        this.log(
          translateCli(
            'commands.light.pull.baseHead',
            { head: state.baseHeadCommitId ?? 'null' },
            {
              fallback: 'Base Head: {{head}}',
            },
          ),
        );
        this.log(
          translateCli(
            'commands.light.pull.context',
            { mode: contextPack.contextMode, reason: contextPack.reason },
            { fallback: 'Context: {{mode}} ({{reason}})' },
          ),
        );
      }
    } catch (error: unknown) {
      const failure =
        error instanceof LightExtensionCliError
          ? error
          : new LightExtensionCliError(error instanceof Error ? error.message : String(error), { cause: error });
      const failureOutput = backupPath ? { ...failure.toJSON(), backupPath } : failure.toJSON();
      if (jsonOutput) this.logToStderr(JSON.stringify(failureOutput, null, 2));
      else {
        if (backupPath) {
          this.logToStderr(
            translateCli(
              'commands.light.pull.backupPreserved',
              { path: backupPath },
              {
                fallback: 'The local backup was preserved at {{path}}.',
              },
            ),
          );
        }
        this.logToStderr(failure.message);
      }
      this.exit(failure.exitCode);
    }
  }
}
