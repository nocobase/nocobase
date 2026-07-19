/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import { buildLightExtensionSettingsHashes } from '../services/LightExtensionEntryService';
import { SettingsResolverService } from '../services/SettingsResolverService';

describe('light extension runtime artifact persistence', () => {
  it('hashes and resolves explicit empty, array, and null defaults without treating them as absent', () => {
    const settingsSchema = {
      type: 'object',
      properties: {
        emptyObject: { type: 'object', default: {} },
        emptyArray: { type: 'array', default: [] },
        nullable: { type: 'string', default: null },
        absent: { type: 'string' },
      },
    };
    const hashes = buildLightExtensionSettingsHashes(settingsSchema);
    const withoutExplicitDefaults = buildLightExtensionSettingsHashes({
      type: 'object',
      properties: {
        emptyObject: { type: 'object' },
        emptyArray: { type: 'array' },
        nullable: { type: 'string' },
        absent: { type: 'string' },
      },
    });
    const expectedDefaultsHash = createHash('sha256')
      .update('{"emptyArray":[],"emptyObject":{},"nullable":null}')
      .digest('hex');

    expect(hashes.settingsDefaultsHash).toBe(expectedDefaultsHash);
    expect(hashes.settingsDefaultsHash).not.toBe(withoutExplicitDefaults.settingsDefaultsHash);
    expect(new SettingsResolverService().getRuntimeDefaults({ id: 'entry_1', settingsSchema })).toEqual({
      emptyObject: {},
      emptyArray: [],
      nullable: null,
    });
  });

  it('deeply merges object-level defaults with property defaults for runtime and hash parity', () => {
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
    const defaults = {
      displayOptions: {
        density: 'compact',
        color: 'red',
        pageSize: 20,
      },
      emptyObject: {},
      explicitNull: null,
    };

    expect(new SettingsResolverService().getRuntimeDefaults({ id: 'entry_1', settingsSchema })).toEqual(defaults);
    expect(buildLightExtensionSettingsHashes(settingsSchema).settingsDefaultsHash).toBe(
      createHash('sha256')
        .update(
          '{"displayOptions":{"color":"red","density":"compact","pageSize":20},"emptyObject":{},"explicitNull":null}',
        )
        .digest('hex'),
    );
  });

  it('preserves explicit root null and array defaults in the defaults hash', () => {
    expect(buildLightExtensionSettingsHashes({ type: ['object', 'null'], default: null }).settingsDefaultsHash).toBe(
      createHash('sha256').update('null').digest('hex'),
    );
    expect(buildLightExtensionSettingsHashes({ type: 'array', default: [] }).settingsDefaultsHash).toBe(
      createHash('sha256').update('[]').digest('hex'),
    );
  });

  it('distinguishes missing settings schemas from explicit empty schemas', () => {
    expect(buildLightExtensionSettingsHashes(null)).toEqual({
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    });
    expect(buildLightExtensionSettingsHashes({})).toEqual({
      settingsSchemaHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
      settingsDefaultsHash: expect.stringMatching(/^[a-f0-9]{64}$/u),
    });
  });
});
