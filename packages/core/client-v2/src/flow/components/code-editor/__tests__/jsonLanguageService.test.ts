/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ENTRY_SCHEMA_URI, lightExtensionEntryV1Schema } from '@nocobase/light-extension-sdk/schema';
import { EditorState } from '@codemirror/state';
import { describe, expect, it, vi } from 'vitest';

import type { CodeEditorJsonSchema } from '../jsonLanguageService';
import { getJsonLanguageCompletions, getJsonLanguageDiagnostics, getJsonLanguageHover } from '../jsonLanguageService';

const entryJsonSchema: CodeEditorJsonSchema = {
  schema: lightExtensionEntryV1Schema,
  uri: LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
};

async function getCompletionLabels(text: string, token: string, offset = token.length) {
  const position = text.indexOf(token) + offset;
  const result = await getJsonLanguageCompletions(text, position, entryJsonSchema);
  return result?.options.map((option) => option.displayLabel || option.label) || [];
}

describe('JSON language service', () => {
  it('provides canonical Entry property and condition completions', async () => {
    const topLevel = await getCompletionLabels('{\n  "ti"\n}', 'ti');
    expect(topLevel).toEqual(expect.arrayContaining(['title', 'tags']));
    const allTopLevel = await getCompletionLabels('{\n  ""\n}', '"', 1);
    expect(allTopLevel).toContain('settings');
    expect(allTopLevel).not.toContain('$schema');
    expect(allTopLevel).not.toContain('settingsSchema');

    const settingsProperty = await getCompletionLabels(
      '{"schemaVersion":1,"key":"demo","settings":{"mode":{"ty"}}}',
      'ty',
    );
    expect(settingsProperty).toEqual(expect.arrayContaining(['type', 'x-component', 'x-visible-when']));

    const condition = await getCompletionLabels(
      '{"schemaVersion":1,"key":"demo","settings":{"mode":{"type":"string","x-visible-when":{"pa"}}}}',
      'pa',
    );
    expect(condition).toEqual(expect.arrayContaining(['path', 'operator', 'value', 'logic', 'items']));

    const operator = await getCompletionLabels(
      '{"schemaVersion":1,"key":"demo","settings":{"mode":{"type":"string","x-visible-when":{"operator":""}}}}',
      'operator":"',
      'operator":"'.length,
    );
    expect(operator).toEqual(['"$eq"', '"$ne"', '"$in"', '"$notIn"', '"$empty"', '"$notEmpty"']);
  });

  it('keeps quoted completion ranges reusable while a property name is being typed', async () => {
    const text = '{"schemaVersion":1,"key":"demo","settings":{"mode":{"en"}}}';
    const position = text.lastIndexOf('en') + 'en'.length;
    const result = await getJsonLanguageCompletions(text, position, entryJsonSchema);
    const validFor = result?.validFor;

    expect(typeof validFor).toBe('function');
    if (typeof validFor !== 'function') {
      throw new Error('JSON completion validFor predicate was not returned');
    }

    const state = EditorState.create({ doc: text });
    expect(validFor('"enum"', 0, 6, state)).toBe(true);
    expect(validFor('"enum":', 0, 7, state)).toBe(false);
    expect(result?.options.find((option) => option.displayLabel === 'enum')?.label).toBe('"enum"');
  });

  it('reports syntax and canonical Schema diagnostics with JSON paths', async () => {
    const syntaxDiagnostics = await getJsonLanguageDiagnostics('{ unquoted: true }');
    expect(syntaxDiagnostics.some((diagnostic) => diagnostic.message.includes('doublequoted'))).toBe(true);

    const descriptorDiagnostics = await getJsonLanguageDiagnostics(
      '{"schemaVersion":2,"key":"demo","unknown":true}',
      entryJsonSchema,
    );
    expect(descriptorDiagnostics.map((diagnostic) => diagnostic.message)).toEqual(
      expect.arrayContaining(['$.schemaVersion: Value must be 1.', '$.unknown: Property unknown is not allowed.']),
    );

    const conditionDiagnostics = await getJsonLanguageDiagnostics(
      JSON.stringify({
        schemaVersion: 1,
        key: 'demo',
        settings: {
          mode: {
            type: 'string',
            'x-visible-when': { path: 'mode', operator: '$in', value: 'not-an-array' },
          },
        },
      }),
      entryJsonSchema,
    );
    expect(conditionDiagnostics.map((diagnostic) => diagnostic.message)).toContain(
      '$.settings.mode["x-visible-when"].value: Incorrect type. Expected "array".',
    );
  });

  it('returns canonical descriptions for Entry hover targets', async () => {
    const text = JSON.stringify({
      schemaVersion: 1,
      key: 'demo',
      settings: {
        mode: {
          type: 'string',
          'x-visible-when': { operator: '$empty', path: 'mode' },
        },
      },
    });

    const keyHover = await getJsonLanguageHover(text, text.indexOf('key') + 1, entryJsonSchema);
    const settingsHover = await getJsonLanguageHover(text, text.indexOf('settings') + 1, entryJsonSchema);
    const conditionHover = await getJsonLanguageHover(text, text.indexOf('x-visible-when') + 1, entryJsonSchema);

    expect(keyHover?.contents).toContain('Stable technical identity');
    expect(settingsHover?.contents).toContain('Settings field definitions');
    expect(conditionHover?.contents).toContain('controls whether this settings field is visible');
  });

  it('never uses browser fetch for external Schema references', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const diagnostics = await getJsonLanguageDiagnostics('{"remote":{}}', {
      uri: 'urn:nocobase:test:no-network',
      schema: {
        properties: {
          remote: { $ref: 'https://example.com/remote.schema.json' },
        },
        type: 'object',
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      diagnostics.some((diagnostic) => diagnostic.message.includes('External JSON Schema requests are disabled')),
    ).toBe(true);
    fetchSpy.mockRestore();
  });
});
