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
  buildHttpError,
  extractEntryRecord,
  extractPullResult,
  inspectPullTarget,
  LightExtensionCliError,
  materializePulledWorkspace,
  resolveLightExtensionTarget,
  unwrapResponseData,
} from '../../lib/light-extension-workspace.js';

export default class LightPull extends Command {
  static override summary = translateCli('commands.light.pull.summary', undefined, {
    fallback: 'Pull a JS Block or JS Page into a local source workspace',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --repo ler_demo --entry lee_demo --dir ./light-demo',
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

    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      const inspection = await inspectPullTarget(workspaceRoot);
      if (inspection.dirty) {
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
              fallback: 'The target directory has local source changes ({{paths}}). Review or remove them before pulling.',
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
      const state = await materializePulledWorkspace({
        workspaceRoot,
        target,
        repoId: flags.repo,
        entry,
        pull,
        previousState: inspection.state,
      });

      const output = {
        ok: true,
        workspace: workspaceRoot,
        repo: state.repo,
        entry: state.entry,
        baseHeadCommitId: state.baseHeadCommitId,
        treeHash: pull.tree?.hash ?? null,
        files: Object.keys(state.files),
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
