/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { getJsonLanguageDiagnostics } from '../jsonLanguageService';

describe('JSON language service', () => {
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
