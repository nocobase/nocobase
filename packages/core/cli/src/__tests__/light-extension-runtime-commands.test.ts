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

async function generateLightExtensionCommands(moduleName: 'js-template' | 'light-extension' = 'light-extension') {
  const runtime = await generateRuntime(swaggerDocument as unknown as OpenApiDocument, configFile);
  return runtime.commands.filter((command) => command.moduleName === moduleName);
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

  it('generates the canonical JS Template API commands with the same operation contract as every legacy alias', async () => {
    const canonicalCommands = await generateLightExtensionCommands('js-template');
    const legacyCommands = await generateLightExtensionCommands();

    expect(canonicalCommands.map((command) => command.commandId)).toEqual([
      'js-template-entries get',
      'js-template-entries list-selectable',
      'js-template-files get-file',
      'js-template-files pull',
      'js-template-files save-source',
      'js-template-references read-references',
      'js-template-repos get',
      'js-template-repos list',
      'js-templates compile-workspace-preview',
      'js-templates move-source',
      'js-templates move-to-inline',
    ]);
    expect(canonicalCommands).toHaveLength(legacyCommands.length);

    for (const canonical of canonicalCommands) {
      const legacyCommandId = canonical.commandId
        .replace(/^js-template-/u, 'light-extension-')
        .replace(/^js-templates /u, 'light-extensions ');
      const legacy = findCommand(legacyCommands, legacyCommandId);
      expect(canonical.pathTemplate).toBe(
        legacy.pathTemplate
          .replace('/lightExtensionRepos:', '/jsTemplateRepos:')
          .replace('/lightExtensionEntries:', '/jsTemplateEntries:')
          .replace('/lightExtensionReferences:', '/jsTemplateReferences:')
          .replace('/lightExtensionFiles:', '/jsTemplateFiles:')
          .replace('/lightExtensions:', '/jsTemplates:'),
      );
      expect(canonical).toMatchObject({
        method: legacy.method,
        actionName: legacy.actionName,
        hasBody: legacy.hasBody,
        bodyRequired: legacy.bodyRequired,
        requestContentType: legacy.requestContentType,
        responseType: legacy.responseType,
      });
      expect(
        canonical.parameters.map(({ name, flagName, in: location, required, type, format, isArray, isFile }) => ({
          name,
          flagName,
          location,
          required,
          type,
          format,
          isArray,
          isFile,
        })),
      ).toEqual(
        legacy.parameters.map(({ name, flagName, in: location, required, type, format, isArray, isFile }) => ({
          name,
          flagName,
          location,
          required,
          type,
          format,
          isArray,
          isFile,
        })),
      );
      expect(canonical.summary).not.toMatch(/light[ -]extension/iu);
      expect(canonical.description).not.toMatch(/light[ -]extension/iu);
      expect(canonical.examples.every((example) => example.startsWith(`nb api ${canonical.commandId}`))).toBe(true);
    }
  });

  it('generates action help for externalization with explicit destinations, idempotency, and body-file examples', async () => {
    const commands = await generateLightExtensionCommands();
    const moveSource = findCommand(commands, 'light-extensions move-source');

    expect(moveSource.summary).toContain('externalize a complete inline RunJS workspace');
    expect(moveSource.description).toContain(
      'destination must select an existing Repository or describe a new Repository',
    );
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
    expect(flags.destination.description).not.toContain('default');
    expect(flags.destination.description).toContain('existing');
    expect(flags.destination.description).toContain('new');
    expect(flags['idempotency-key'].description).toContain('retry key');
    expect(flags['body-file'].helpGroup).toBe('Raw JSON Body');
  });

  it('generates idempotent move-back and reusable Entry help', async () => {
    const commands = await generateLightExtensionCommands();
    const moveToInline = findCommand(commands, 'light-extensions move-to-inline');
    const listSelectable = findCommand(commands, 'light-extension-entries list-selectable');

    expect(moveToInline.summary).toContain('relocate a complete reachable Light Extension Entry workspace');
    expect(moveToInline.description).toContain('idempotencyKey is required');
    expect(moveToInline.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'idempotencyKey', flagName: 'idempotency-key', required: true }),
      ]),
    );
    expect(moveToInline.examples).toEqual(['nb api light-extensions move-to-inline --body-file <path>']);
    const moveToInlineFlags = createGeneratedFlags(moveToInline);
    expect(moveToInlineFlags['idempotency-key'].description).toContain('retry key');
    expect(moveToInlineFlags['body-file'].helpGroup).toBe('Raw JSON Body');

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
