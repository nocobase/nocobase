/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';

type SourceBindingKind = 'js-block' | 'js-field' | 'js-action' | 'js-item';

const sourceBinding = (kind: SourceBindingKind) => ({
  type: 'light-extension-entry',
  repoId: `repo_${kind}`,
  entryId: `entry_${kind}`,
  kind,
});

function sourceSettings(kind: SourceBindingKind) {
  return {
    sourceMode: 'light-extension',
    sourceBinding: sourceBinding(kind),
  };
}

describe('flowSurfaces source binding authoring validation', () => {
  it('should accept binding-only source across all public JS surfaces', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      blocks: [
        {
          type: 'jsBlock',
          settings: sourceSettings('js-block'),
        },
        {
          type: 'table',
          fields: [
            {
              type: 'jsColumn',
              settings: sourceSettings('js-field'),
            },
            {
              fieldPath: 'status',
              renderer: 'js',
              settings: sourceSettings('js-field'),
            },
          ],
          actions: [
            {
              type: 'js',
              settings: sourceSettings('js-action'),
            },
            {
              type: 'jsItem',
              settings: sourceSettings('js-item'),
            },
          ],
        },
        {
          type: 'createForm',
          fields: [
            {
              fieldPath: 'status',
              renderer: 'js',
              settings: sourceSettings('js-field'),
            },
            {
              type: 'jsItem',
              settings: sourceSettings('js-item'),
            },
          ],
        },
      ],
    });

    expect(errors.map((error) => error.ruleId)).not.toEqual(
      expect.arrayContaining([
        'jsBlock-source-required',
        'jsItem-source-required',
        'jsBlock-sourceBinding-required',
        'runjs-sourceBinding-required',
        'runjs-sourceBinding-kind-invalid',
      ]),
    );
  });

  it('should require bindings for light-extension mode on every JS surface kind', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      blocks: [
        {
          type: 'jsBlock',
          settings: {
            sourceMode: 'light-extension',
          },
        },
        {
          type: 'table',
          fields: [
            {
              type: 'jsColumn',
              settings: {
                sourceMode: 'light-extension',
              },
            },
          ],
          actions: [
            {
              type: 'js',
              settings: {
                sourceMode: 'light-extension',
              },
            },
            {
              type: 'jsItem',
              settings: {
                sourceMode: 'light-extension',
              },
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].settings.sourceBinding',
          ruleId: 'jsBlock-sourceBinding-required',
        }),
        expect.objectContaining({
          path: '$.blocks[1].fields[0].settings.sourceBinding',
          ruleId: 'runjs-sourceBinding-required',
        }),
        expect.objectContaining({
          path: '$.blocks[1].actions[0].settings.sourceBinding',
          ruleId: 'runjs-sourceBinding-required',
        }),
        expect.objectContaining({
          path: '$.blocks[1].actions[1].settings.sourceBinding',
          ruleId: 'runjs-sourceBinding-required',
        }),
      ]),
    );
  });

  it('should aggregate binding shape, type, and kind errors with surface-specific expectedKind', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors('compose', {
      blocks: [
        {
          type: 'table',
          fields: [
            {
              type: 'jsColumn',
              settings: {
                sourceMode: 'light-extension',
                sourceBinding: {
                  type: 'file',
                  repoId: '',
                  kind: 'js-block',
                },
              },
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.blocks[0].fields[0].settings.sourceBinding.repoId',
          ruleId: 'runjs-sourceBinding-required-key',
        }),
        expect.objectContaining({
          path: '$.blocks[0].fields[0].settings.sourceBinding.entryId',
          ruleId: 'runjs-sourceBinding-required-key',
        }),
        expect.objectContaining({
          path: '$.blocks[0].fields[0].settings.sourceBinding.type',
          ruleId: 'runjs-sourceBinding-type-invalid',
        }),
        expect.objectContaining({
          path: '$.blocks[0].fields[0].settings.sourceBinding.kind',
          ruleId: 'runjs-sourceBinding-kind-invalid',
          details: expect.objectContaining({
            expectedKind: 'js-field',
          }),
        }),
      ]),
    );
  });

  it('should merge configure partial bindings with the current canonical RunJS source', async () => {
    const cases = [
      { use: 'JSBlockModel', kind: 'js-block', group: 'jsSettings' },
      { use: 'JSColumnModel', kind: 'js-field', group: 'jsSettings' },
      { use: 'JSFieldModel', kind: 'js-field', group: 'jsSettings' },
      { use: 'JSEditableFieldModel', kind: 'js-field', group: 'jsSettings' },
      { use: 'JSItemModel', kind: 'js-item', group: 'jsSettings' },
      { use: 'JSItemActionModel', kind: 'js-item', group: 'jsSettings' },
      { use: 'JSActionModel', kind: 'js-action', group: 'clickSettings' },
    ] as const;

    for (const item of cases) {
      const errors = await collectFlowSurfaceAuthoringErrors(
        'configure',
        {
          changes: {
            sourceBinding: {
              entryId: 'entry_next',
            },
          },
        },
        {
          currentNode: {
            use: item.use,
            stepParams: {
              [item.group]: {
                runJs: sourceSettings(item.kind),
              },
            },
          },
        },
      );
      expect(
        errors.filter((error) => error.ruleId.includes('sourceBinding') || error.ruleId.includes('sourceMode')),
        item.use,
      ).toHaveLength(0);
    }

    const newBindingErrors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        changes: {
          sourceBinding: {
            entryId: 'entry_new',
          },
        },
      },
      {
        currentNode: {
          use: 'JSActionModel',
          stepParams: {},
        },
      },
    );
    expect(newBindingErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '$.changes.sourceBinding.type', ruleId: 'runjs-sourceBinding-required-key' }),
        expect.objectContaining({ path: '$.changes.sourceBinding.repoId', ruleId: 'runjs-sourceBinding-required-key' }),
        expect.objectContaining({ path: '$.changes.sourceBinding.kind', ruleId: 'runjs-sourceBinding-required-key' }),
      ]),
    );
  });

  it('should reject inline or script asset mixing and raw stepParams bypasses', async () => {
    const binding = sourceBinding('js-field');
    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', {
      mode: 'create',
      assets: {
        scripts: {
          summary: {
            code: "ctx.render('Summary');",
          },
        },
      },
      tabs: [
        {
          title: 'Overview',
          blocks: [
            {
              type: 'table',
              fields: [
                {
                  type: 'jsColumn',
                  script: 'summary',
                  settings: {
                    sourceMode: 'light-extension',
                    sourceBinding: binding,
                  },
                },
              ],
              actions: [
                {
                  type: 'js',
                  stepParams: {
                    clickSettings: {
                      runJs: sourceSettings('js-action'),
                    },
                  },
                  settings: {
                    sourceMode: 'inline',
                    sourceBinding: sourceBinding('js-action'),
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].fields[0].script',
          ruleId: 'runjs-mixed-script-and-light-extension',
        }),
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].actions[0].settings.sourceBinding',
          ruleId: 'runjs-inline-sourceBinding-unsupported',
        }),
        expect.objectContaining({
          path: '$.tabs[0].blocks[0].actions[0].stepParams',
          ruleId: 'runjs-stepParams-unsupported',
        }),
      ]),
    );
  });

  it('should not inspect historical fallback code when configure only updates a binding', async () => {
    const errors = await collectFlowSurfaceAuthoringErrors(
      'configure',
      {
        changes: {
          sourceBinding: {
            entryId: 'entry_next',
          },
        },
      },
      {
        currentNode: {
          use: 'JSBlockModel',
          stepParams: {
            jsSettings: {
              runJs: {
                code: 'window.localStorage.clear();',
                ...sourceSettings('js-block'),
              },
            },
          },
        },
      },
    );

    expect(errors.map((error) => error.ruleId)).not.toContain('unknown-global-stop');
  });
});
