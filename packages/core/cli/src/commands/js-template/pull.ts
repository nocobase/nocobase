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
  buildHttpError,
  extractTemplateRecord,
  extractPullResult,
  inspectPullTarget,
  JsTemplateCliError,
  materializePulledWorkspace,
  resolveJsTemplateTarget,
  unwrapResponseData,
} from '../../lib/js-template-workspace.js';

export default class JsTemplatePull extends Command {
  protected apiPaths: JsTemplateWorkspaceApiPaths = JS_TEMPLATE_WORKSPACE_API_PATHS;

  static override summary = translateCli('commands.jsTemplate.pull.summary', undefined, {
    fallback: 'Pull a JS Template (JS Block or JS Page) into a local source workspace',
  });

  static override examples = [
    '<%= config.bin %> <%= command.id %> --project jtp_demo --template jtt_demo --dir ./js-template-demo',
    '<%= config.bin %> <%= command.id %> --project jtp_demo --template jtt_demo --dir ./js-template-demo --json-output',
  ];

  static override flags = {
    project: Flags.string({
      description: translateCli('commands.jsTemplate.flags.project', undefined, { fallback: 'JS Template project id' }),
      required: true,
    }),
    template: Flags.string({
      description: translateCli('commands.jsTemplate.flags.template', undefined, { fallback: 'JS Block or JS Page template id' }),
      required: true,
    }),
    dir: Flags.string({
      description: translateCli('commands.jsTemplate.flags.dir', undefined, { fallback: 'Local workspace directory' }),
      required: true,
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
    const { flags } = await this.parse(JsTemplatePull);
    const jsonOutput = flags['json-output'];

    try {
      const workspaceRoot = assertSafeWorkspaceDirectory(flags.dir);
      const inspection = await inspectPullTarget(workspaceRoot);
      if (inspection.dirty) {
        throw new JsTemplateCliError(
          translateCli(
            'commands.jsTemplate.pull.dirtyRefusal',
            {
              paths:
                inspection.changedPaths.join(', ') ||
                inspection.stateError ||
                translateCli('commands.jsTemplate.pull.unknownLocalState', undefined, { fallback: 'unknown local state' }),
            },
            {
              fallback:
                'The target directory has local source changes ({{paths}}). Review or remove them before pulling.',
            },
          ),
          { details: { changedPaths: inspection.changedPaths, stateError: inspection.stateError } },
        );
      }

      const target = await resolveJsTemplateTarget({
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
      const templateResponse = await executeRawApiRequest({
        ...requestOptions,
        method: 'POST',
        path: this.apiPaths.templateGet,
        body: { templateId: flags.template },
      });
      if (!templateResponse.ok)
        throw buildHttpError(
          templateResponse.status,
          templateResponse.data,
          translateCli('commands.jsTemplate.operations.templateRead', undefined, { fallback: 'JS Template read' }),
        );
      const template = extractTemplateRecord(unwrapResponseData(templateResponse.data));
      if (template.projectId !== flags.project) {
        throw new JsTemplateCliError(
          translateCli(
            'commands.jsTemplate.pull.errors.templateProjectMismatch',
            { template: flags.template, actualProject: template.projectId, selectedProject: flags.project },
            { fallback: 'Template "{{template}}" belongs to project "{{actualProject}}", not "{{selectedProject}}".' },
          ),
        );
      }

      const pullResponse = await executeRawApiRequest({
        ...requestOptions,
        method: 'POST',
        path: this.apiPaths.filesPull,
        body: { projectId: flags.project, ref: 'head', includeContent: 'all' },
      });
      if (!pullResponse.ok)
        throw buildHttpError(
          pullResponse.status,
          pullResponse.data,
          translateCli('commands.jsTemplate.operations.pull', undefined, { fallback: 'JS Template pull' }),
        );
      const pull = extractPullResult(unwrapResponseData(pullResponse.data));
      const state = await materializePulledWorkspace({
        workspaceRoot,
        target,
        projectId: flags.project,
        template,
        pull,
        previousState: inspection.state,
      });

      const output = {
        ok: true,
        workspace: workspaceRoot,
        project: state.project,
        template: state.template,
        baseHeadCommitId: state.baseHeadCommitId,
        treeHash: pull.tree?.hash ?? null,
        files: Object.keys(state.files),
      };
      if (jsonOutput) {
        this.log(JSON.stringify(output, null, 2));
      } else {
        this.log(
          translateCli(
            'commands.jsTemplate.pull.success',
            { count: Object.keys(state.files).length, workspace: workspaceRoot },
            { fallback: 'Pulled {{count}} files into {{workspace}}.' },
          ),
        );
        this.log(
          translateCli(
            'commands.jsTemplate.pull.baseHead',
            { head: state.baseHeadCommitId ?? 'null' },
            {
              fallback: 'Base Head: {{head}}',
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
