/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../constants';
import { createDefaultLightExtensionTemplate } from '../../shared/default-template';
import { normalizeRunJSSourceLocator } from '../../shared/vsc-file/runjs-source-types';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import {
  getReferenceOwnerAdapterByOwnerKind,
  getReferenceOwnerAdapterByUse,
  listReferenceOwnerAdapters,
} from '../services/ReferenceOwnerRegistry';

describe('generic RunJS hard-delete boundary', () => {
  it('publishes exactly the five complete JS Model kinds', () => {
    expect(LIGHT_EXTENSION_SUPPORTED_KINDS).toEqual(['js-block', 'js-page', 'js-field', 'js-action', 'js-item']);
    expect(listReferenceOwnerAdapters().map(({ kind }) => kind)).toEqual(LIGHT_EXTENSION_SUPPORTED_KINDS);
    expect(getReferenceOwnerAdapterByUse('JSColumnModel')).toMatchObject({
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
    });
    expect(getReferenceOwnerAdapterByOwnerKind('flowModel.runjsHost')).toBeUndefined();
  });

  it('rejects the removed generic source root without weakening retained roots', () => {
    const validator = new LightExtensionValidator();
    const result = validator.validateWorkspace({
      files: [
        { path: 'src/client/runjs/calculate/index.ts', content: 'return 1;\n' },
        {
          path: 'src/client/runjs/calculate/entry.json',
          content: JSON.stringify({ schemaVersion: 1, key: 'calculate', title: 'Calculate' }),
        },
      ],
    });

    expect(result.accepted).toBe(false);
    expect(result.entries).toEqual([]);
    expect(result.capabilities.supportedKinds).toEqual(LIGHT_EXTENSION_SUPPORTED_KINDS);
    expect(result.capabilities.allowedPaths.repo).toEqual(
      expect.arrayContaining([
        'src/client/js-blocks/**',
        'src/client/js-pages/**',
        'src/client/js-fields/**',
        'src/client/js-actions/**',
        'src/client/js-items/**',
      ]),
    );
    expect(result.capabilities.allowedPaths.repo).not.toContain('src/client/runjs/**');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'workspace_path_not_allowed', path: 'src/client/runjs/calculate/index.ts' }),
        expect.objectContaining({
          code: 'workspace_path_not_allowed',
          path: 'src/client/runjs/calculate/entry.json',
        }),
      ]),
    );
  });

  it('fails closed when a legacy nested locator reaches the public normalizer', () => {
    let caught: unknown;
    try {
      normalizeRunJSSourceLocator({
        kind: 'flowModel.nestedRunJS',
        modelUid: 'fm_legacy',
        containerFlowKey: 'formModelSettings',
        containerStepKey: 'assignRules',
        valuePath: ['value', 0, 'value'],
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({
      code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
      details: { kind: 'flowModel.nestedRunJS' },
    });
  });

  it('keeps generic source files out of newly created repositories', () => {
    const paths = createDefaultLightExtensionTemplate().map(({ path }) => path);

    expect(paths.some((path) => path.startsWith('src/client/runjs/'))).toBe(false);
    expect(paths).toEqual(
      expect.arrayContaining([
        'src/client/js-blocks/welcome-card/index.tsx',
        'src/client/js-pages/hello-page/index.tsx',
        'src/client/js-fields/status-tag/index.tsx',
        'src/client/js-actions/refresh-data/index.ts',
        'src/client/js-items/form-total-preview/index.tsx',
      ]),
    );
  });
});
