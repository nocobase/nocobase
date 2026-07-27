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

import swaggerDocument from '../../../../plugins/@nocobase/plugin-light-extension/src/swagger/index.js';
import flowEngineSwaggerDocument from '../../../../plugins/@nocobase/plugin-flow-engine/src/swagger/index.js';
import { createGeneratedFlags, type GeneratedOperation } from '../lib/generated-command.js';
import type { OpenApiDocument } from '../lib/openapi.js';
import { generateRuntime } from '../lib/runtime-generator.js';

const configFile = resolve('packages/core/cli/nocobase-ctl.config.json');

async function generateLightExtensionCommands() {
  const runtime = await generateRuntime(swaggerDocument as unknown as OpenApiDocument, configFile);
  return runtime.commands.filter((command) => command.moduleName === 'light-extension');
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

describe('Light Extension runtime commands', () => {
  it('generates the always-on RunJS authoring capability command', async () => {
    const commands = await generateRunJSCommands();

    expect(commands.map((command) => command.commandId)).toEqual(['run-js-sources capabilities']);
    expect(commands[0]).toMatchObject({
      method: 'post',
      pathTemplate: '/runJSSources:capabilities',
      responseType: 'json',
    });
  });

  it('generates the complete public Light Extension command registry from the real Swagger and CLI config', async () => {
    const commands = await generateLightExtensionCommands();

    expect(commands.map((command) => command.commandId)).toEqual([
      'light-extension-entries get',
      'light-extension-entries list-selectable',
      'light-extension-files get-file',
      'light-extension-files pull',
      'light-extension-files save-source',
      'light-extension-references read-references',
      'light-extension-repos get',
      'light-extension-repos list',
      'light-extensions compile-workspace-preview',
      'light-extensions move-source',
      'light-extensions move-to-inline',
    ]);
    expect(commands.map((command) => command.pathTemplate)).toEqual(
      expect.arrayContaining([
        '/lightExtensionEntries:listSelectable',
        '/lightExtensions:moveSource',
        '/lightExtensions:moveToInline',
        '/lightExtensionFiles:pull',
        '/lightExtensionFiles:saveSource',
      ]),
    );
  });

  it('generates action help for externalization with all destination forms, idempotency, and body-file examples', async () => {
    const commands = await generateLightExtensionCommands();
    const moveSource = findCommand(commands, 'light-extensions move-source');

    expect(moveSource.summary).toContain('externalize a complete inline RunJS workspace');
    expect(moveSource.description).toContain('destination supports default, existing, and new');
    expect(moveSource.description).toContain('idempotencyKey');
    expect(moveSource.description).toContain('HTTP POST /lightExtensions:moveSource');
    expect(moveSource.examples).toEqual(['nb api light-extensions move-source --body-file <path>']);
    expect(moveSource.parameters.map((parameter) => parameter.flagName)).toEqual(
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
        'entry-name',
        'entry-title',
      ]),
    );

    const flags = createGeneratedFlags(moveSource);
    expect(flags.destination.description).toContain('default');
    expect(flags.destination.description).toContain('existing');
    expect(flags.destination.description).toContain('new');
    expect(flags['idempotency-key'].description).toContain('retry key');
    expect(flags['body-file'].helpGroup).toBe('Raw JSON Body');
  });

  it('generates move-back and reusable Entry help without claiming move-back idempotency', async () => {
    const commands = await generateLightExtensionCommands();
    const moveToInline = findCommand(commands, 'light-extensions move-to-inline');
    const listSelectable = findCommand(commands, 'light-extension-entries list-selectable');

    expect(moveToInline.summary).toContain('relocate a complete reachable Light Extension Entry workspace');
    expect(moveToInline.description).toContain('does not accept an idempotency key');
    expect(moveToInline.parameters.some((parameter) => parameter.name === 'idempotencyKey')).toBe(false);
    expect(moveToInline.examples).toEqual(['nb api light-extensions move-to-inline --body-file <path>']);
    expect(createGeneratedFlags(moveToInline)['body-file'].helpGroup).toBe('Raw JSON Body');

    expect(listSelectable.summary).toContain('List compiled Entries');
    expect(listSelectable.parameters.map((parameter) => parameter.flagName)).toEqual(['repo-id', 'kind']);
    expect(listSelectable.description).toContain('source binding');
    expect(createGeneratedFlags(listSelectable)).toEqual(
      expect.objectContaining({
        'repo-id': expect.objectContaining({ helpGroup: 'Body Field' }),
        kind: expect.objectContaining({ helpGroup: 'Body Field' }),
        'body-file': expect.objectContaining({ helpGroup: 'Raw JSON Body' }),
      }),
    );
  });
});
