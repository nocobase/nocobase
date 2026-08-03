/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as canonicalRoot from '@nocobase/js-template-sdk';
import * as canonicalClient from '@nocobase/js-template-sdk/client';
import canonicalPackageJson from '@nocobase/js-template-sdk/package.json';
import * as canonicalSchema from '@nocobase/js-template-sdk/schema';
import canonicalEntrySchema from '@nocobase/js-template-sdk/schema/entry-v1.schema.json';
import * as canonicalSchemaServer from '@nocobase/js-template-sdk/schema/server';
import * as canonicalShared from '@nocobase/js-template-sdk/shared';
import * as canonicalTypegen from '@nocobase/js-template-sdk/typegen';
import * as legacyRoot from '@nocobase/light-extension-sdk';
import * as legacyClient from '@nocobase/light-extension-sdk/client';
import legacyPackageJson from '@nocobase/light-extension-sdk/package.json';
import * as legacySchema from '@nocobase/light-extension-sdk/schema';
import * as legacySchemaServer from '@nocobase/light-extension-sdk/schema/server';
import * as legacyShared from '@nocobase/light-extension-sdk/shared';
import * as legacyTypegen from '@nocobase/light-extension-sdk/typegen';
import { describe, expect, it } from 'vitest';

const publicSubpaths = [
  '.',
  './client',
  './shared',
  './schema',
  './schema/server',
  './schema/entry-v1.schema.json',
  './typegen',
  './package.json',
] as const;

describe('@nocobase/light-extension-sdk compatibility facade', () => {
  it('keeps the canonical package name and the complete legacy export map', () => {
    expect(canonicalPackageJson.name).toBe('@nocobase/js-template-sdk');
    expect(Object.keys(canonicalPackageJson.exports)).toEqual(publicSubpaths);
    expect(legacyPackageJson.name).toBe('@nocobase/light-extension-sdk');
    expect(Object.keys(legacyPackageJson.exports)).toEqual(publicSubpaths);
    expect(legacyPackageJson.exports['./schema/entry-v1.schema.json']).toBe('./lib/schema/entry-v1.schema.json');
    expect(legacyPackageJson.dependencies).toEqual({
      '@nocobase/js-template-sdk': canonicalPackageJson.version,
    });
  });

  it('re-exports every JavaScript and declaration subpath from the canonical implementation', () => {
    expect(Object.keys(legacyRoot).sort()).toEqual(Object.keys(canonicalRoot).sort());
    expect(Object.keys(legacyClient).sort()).toEqual(Object.keys(canonicalClient).sort());
    expect(Object.keys(legacyShared).sort()).toEqual(Object.keys(canonicalShared).sort());
    expect(Object.keys(legacySchema).sort()).toEqual(Object.keys(canonicalSchema).sort());
    expect(Object.keys(legacySchemaServer).sort()).toEqual(Object.keys(canonicalSchemaServer).sort());
    expect(Object.keys(legacyTypegen).sort()).toEqual(Object.keys(canonicalTypegen).sort());

    expect(legacyClient.defineSettings).toBe(canonicalClient.defineSettings);
    expect(legacySchema.lightExtensionEntryV1Schema).toBe(canonicalSchema.lightExtensionEntryV1Schema);
    expect(legacyTypegen.generateClientSettingsTypes).toBe(canonicalTypegen.generateClientSettingsTypes);
    expect(legacySchemaServer.lightExtensionEntryV1SchemaSha256).toBe(
      canonicalSchemaServer.lightExtensionEntryV1SchemaSha256,
    );
  });

  it('keeps the legacy schema URI, JSON schema, virtual import, generated path, and declarations', () => {
    expect(canonicalEntrySchema).toBe(canonicalSchema.lightExtensionEntryV1Schema);
    expect(canonicalSchema.LIGHT_EXTENSION_ENTRY_SCHEMA_URI).toBe(
      'https://schemas.nocobase.com/light-extension/entry-v1.schema.json',
    );
    expect(canonicalTypegen.LIGHT_EXTENSION_SETTINGS_IMPORT_PREFIX).toBe('light-extension:settings/');
    expect(canonicalTypegen.LIGHT_EXTENSION_GENERATED_TYPES_ROOT).toBe('.light-extension/types');

    const result = canonicalTypegen.generateClientSettingsTypes({
      files: [
        {
          path: 'src/client/js-blocks/example/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'example', settings: {} }),
        },
      ],
    });
    expect(result.entries[0].virtualImport).toBe('light-extension:settings/client/js-block/example');
    expect(result.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        '.light-extension/types/sdk.d.ts',
        '.light-extension/types/modules.d.ts',
        '.light-extension/types/client/js-block/example.d.ts',
      ]),
    );
    const declarations = result.files.find((file) => file.path.endsWith('/sdk.d.ts'))?.content;
    expect(declarations).toContain('declare module "@nocobase/js-template-sdk/client"');
    expect(declarations).toContain('declare module "@nocobase/light-extension-sdk/client"');
  });
});
