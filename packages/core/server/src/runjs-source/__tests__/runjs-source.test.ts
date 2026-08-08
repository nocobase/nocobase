/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildRunJSOwnerFingerprint, RunJSSourceCodeInspectorRegistry, RunJSSourceError } from '..';

describe('RunJS source server contracts', () => {
  it('keeps owner fingerprint serialization stable', () => {
    expect(
      buildRunJSOwnerFingerprint({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ownerUpdatedAt: '2026-07-11T00:00:00.000Z',
        selectedLegacyValue: {
          code: 'return 1;',
          nested: { b: 2, a: 1 },
        },
        selectedVersion: 'v2',
      }),
    ).toBe('42a00f8df46b459d0e61a49b4806bc026ff02b8da90202064c3c35193eb8efbb');
  });

  it('maps source errors to stable HTTP responses', () => {
    const error = new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', 'Source not found', {
      details: { locatorKind: 'flowModel.step' },
    });

    expect(error.status).toBe(404);
    expect(error.toResponseBody()).toEqual({
      errors: [
        {
          code: 'RUNJS_SOURCE_NOT_FOUND',
          message: 'Source not found',
          status: 404,
          details: { locatorKind: 'flowModel.step' },
        },
      ],
    });
  });

  it('keeps a shared inspector active until every app unregisters it', () => {
    const registry = new RunJSSourceCodeInspectorRegistry();
    const inspector = () => [{ message: 'checked' }];
    const unregisterFirst = registry.register(inspector);
    const unregisterSecond = registry.register(inspector);
    const input = { code: '', path: 'src/main.ts', surfaceStyle: 'action' as const };

    unregisterFirst();
    expect(registry.inspect(input)).toEqual([{ message: 'checked' }]);

    unregisterSecond();
    expect(registry.inspect(input)).toEqual([]);
  });
});
