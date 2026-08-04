/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import swaggerDocument from '../../../../plugins/@nocobase/plugin-js-template/src/swagger/index.js';
import flowEngineSwaggerDocument from '../../../../plugins/@nocobase/plugin-flow-engine/src/swagger/index.js';
import { createGeneratedFlags, type GeneratedOperation } from '../lib/generated-command.js';
import type { OpenApiDocument } from '../lib/openapi.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const configFile = resolve('packages/core/cli/nocobase-ctl.config.json');

async function generateJsTemplateCommands() {
  const runtime = await generateRuntime(swaggerDocument as unknown as OpenApiDocument, configFile);
  return runtime.commands.filter((command) => command.moduleName === 'js-template');
}

async function generateRunJSCommands() {
  const runtime = await generateRuntime(flowEngineSwaggerDocument as unknown as OpenApiDocument, configFile);
  return runtime.commands.filter((command) => command.moduleName === 'run-js');
}

function findCommand(commands: GeneratedOperation[], commandId: string): GeneratedOperation {
  const command = commands.find((candidate) => candidate.commandId === commandId);
  if (!command) {
    throw new Error(`Generated command "${commandId}" was not found`);
  }
  return command;
}

describe('JS Template runtime commands', () => {
  it('generates the always-on RunJS authoring capability command', async () => {
    const commands = await generateRunJSCommands();

    expect(commands.map((command) => command.commandId)).toEqual(['run-js-sources capabilities']);
    expect(commands[0]).toMatchObject({
      method: 'post',
      pathTemplate: '/runJSSources:capabilities',
      responseType: 'json',
    });
  });

  it('generates the complete public JS Template command registry from the real Swagger and CLI config', async () => {
    const commands = await generateJsTemplateCommands();

    expect(commands.map((command) => command.commandId)).toEqual([
      'js-template-files get-file',
      'js-template-files pull',
      'js-template-files save-source',
      'js-template-projects get',
      'js-template-projects list',
      'js-template-usages list-usages',
      'js-templates compile-workspace-preview',
      'js-templates detach-to-inline',
      'js-templates get',
      'js-templates list-selectable',
      'js-templates save-as-js-template',
    ]);
    expect(commands.map((command) => command.pathTemplate)).toEqual(
      expect.arrayContaining([
        '/jsTemplates:listSelectable',
        '/jsTemplates:saveAsJsTemplate',
        '/jsTemplates:detachToInline',
        '/jsTemplateFiles:pull',
        '/jsTemplateFiles:saveSource',
      ]),
    );
  });

  it('generates only canonical JS Template resources and actions', async () => {
    const commands = await generateJsTemplateCommands();

    expect(commands).not.toHaveLength(0);
    for (const command of commands) {
      expect(command.commandId).toMatch(/^js-template(?:s|-files|-projects|-usages) /u);
      expect(command.pathTemplate).toMatch(/^\/jsTemplate(?:s|Files|Projects|Usages):/u);
      expect(command.summary).not.toMatch(/legacy|alias/iu);
      expect(command.description).not.toMatch(/legacy|alias/iu);
      expect(command.examples.every((example) => example.startsWith(`nb api ${command.commandId}`))).toBe(true);
    }
  });

  it('generates action help for externalization with explicit destinations, idempotency, and body-file examples', async () => {
    const commands = await generateJsTemplateCommands();
    const saveAsJsTemplate = findCommand(commands, 'js-templates save-as-js-template');

    expect(saveAsJsTemplate.summary).toContain('externalize a complete inline RunJS workspace');
    expect(saveAsJsTemplate.description).toContain(
      'destination must select an existing Project or describe a new Project',
    );
    expect(saveAsJsTemplate.description).toContain('idempotencyKey');
    expect(saveAsJsTemplate.description).toContain('HTTP POST /jsTemplates:saveAsJsTemplate');
    expect(saveAsJsTemplate.examples).toEqual(['nb api js-templates save-as-js-template --body-file <path>']);
    expect(saveAsJsTemplate.parameters.map((parameter) => parameter.flagName)).toEqual(
      expect.arrayContaining([
        'idempotency-key',
        'locator',
        'expected-owner-fingerprint',
        'source-repo-id',
        'source-head-commit-id',
        'entry-path',
        'version',
        'files',
        'origin-binding',
        'destination',
        'template-name',
        'template-title',
      ]),
    );

    const flags = createGeneratedFlags(saveAsJsTemplate);
    expect(flags.destination.description).not.toContain('default');
    expect(flags.destination.description).toContain('existing');
    expect(flags.destination.description).toContain('new');
    expect(flags['idempotency-key'].description).toContain('retry key');
    expect(flags['body-file'].helpGroup).toBe('Raw JSON Body');
  });

  it('generates idempotent move-back and reusable Template help', async () => {
    const commands = await generateJsTemplateCommands();
    const detachToInline = findCommand(commands, 'js-templates detach-to-inline');
    const listSelectable = findCommand(commands, 'js-templates list-selectable');

    expect(detachToInline.summary).toContain('relocate a complete reachable JS Template workspace');
    expect(detachToInline.description).toContain('idempotencyKey is required');
    expect(detachToInline.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'idempotencyKey', flagName: 'idempotency-key', required: true }),
      ]),
    );
    expect(detachToInline.examples).toEqual(['nb api js-templates detach-to-inline --body-file <path>']);
    const detachToInlineFlags = createGeneratedFlags(detachToInline);
    expect(detachToInlineFlags['idempotency-key'].description).toContain('retry key');
    expect(detachToInlineFlags['body-file'].helpGroup).toBe('Raw JSON Body');

    expect(listSelectable.summary).toContain('List compiled Templates');
    expect(listSelectable.parameters.map((parameter) => parameter.flagName)).toEqual(['project-id', 'kind']);
    expect(listSelectable.description).toContain('source binding');
    expect(createGeneratedFlags(listSelectable)).toEqual(
      expect.objectContaining({
        'project-id': expect.objectContaining({ helpGroup: 'Body Field' }),
        kind: expect.objectContaining({ helpGroup: 'Body Field' }),
        'body-file': expect.objectContaining({ helpGroup: 'Raw JSON Body' }),
      }),
    );
  });
});
