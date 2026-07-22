/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { sha256Hex, stableSerialize } from '@nocobase/runjs';
import { extractRunJSSettingsDefault } from '@nocobase/runjs/settings';

import { buildLightExtensionSettingsHashes } from '../services/LightExtensionEntryService';

describe('light extension settings hashes', () => {
  it('keeps canonical settings defaults serialization and hash in parity', () => {
    const settingsSchema = {
      type: 'object',
      default: {
        displayOptions: {
          color: 'red',
        },
        explicitNull: null,
      },
      properties: {
        displayOptions: {
          type: 'object',
          default: {
            pageSize: 20,
          },
          properties: {
            density: { type: 'string', default: 'compact' },
            color: { type: 'string', default: 'blue' },
          },
        },
        emptyObject: { type: 'object', default: {} },
        explicitNull: { type: ['string', 'null'], default: 'fallback' },
      },
    };
    const canonicalDefaults = stableSerialize(extractRunJSSettingsDefault(settingsSchema).value);

    expect(canonicalDefaults).toBe(
      '{"displayOptions":{"color":"red","density":"compact","pageSize":20},"emptyObject":{},"explicitNull":null}',
    );
    expect(buildLightExtensionSettingsHashes(settingsSchema)).toEqual({
      settingsSchemaHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      settingsDefaultsHash: sha256Hex(canonicalDefaults),
    });
  });

  it('distinguishes missing settings schemas from explicit empty schemas', () => {
    const missingSchemaHashes = buildLightExtensionSettingsHashes(null);
    const emptySchemaHashes = buildLightExtensionSettingsHashes({});

    expect(missingSchemaHashes).toEqual({
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    });
    expect(emptySchemaHashes).toEqual({
      settingsSchemaHash: sha256Hex('{}'),
      settingsDefaultsHash: sha256Hex('{}'),
    });
    expect(emptySchemaHashes).not.toEqual(missingSchemaHashes);
  });
});
