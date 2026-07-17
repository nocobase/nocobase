/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { getNodeContract } from '../flow-surfaces/catalog';
import { FlowSurfaceContractGuard } from '../flow-surfaces/contract-guard';
import { clearInactiveRunJsSourceBinding, FlowSurfacesService } from '../flow-surfaces/service';
import { buildRunJsSourceChanges, splitComposeFieldChanges } from '../flow-surfaces/service-utils';

const currentRunJs = {
  code: "ctx.render('fallback');",
  version: 'v2',
  sourceMode: 'light-extension',
  sourceBinding: {
    type: 'light-extension-entry',
    repoId: 'repo_fields',
    entryId: 'entry_old',
    kind: 'js-field',
  },
  settings: {
    currency: 'CNY',
    precision: 2,
  },
};

describe('flowSurfaces JS field light-extension write contract', () => {
  it('deep merges partial binding and settings while preserving fallback code and binding identity', () => {
    const changes = buildRunJsSourceChanges({
      sourceBinding: {
        entryId: 'entry_new',
      },
      settings: {
        currency: 'USD',
      },
    });
    const contract = getNodeContract('JSFieldModel').domains.stepParams;
    if (!contract) {
      throw new Error('JSFieldModel stepParams contract is required');
    }
    const merged = new FlowSurfaceContractGuard().mergeDomainValue(
      'stepParams',
      {
        jsSettings: {
          runJs: currentRunJs,
        },
      },
      {
        jsSettings: {
          runJs: changes,
        },
      },
      contract,
      'JSFieldModel',
    );

    expect(merged.jsSettings.runJs).toEqual({
      ...currentRunJs,
      sourceBinding: {
        ...currentRunJs.sourceBinding,
        entryId: 'entry_new',
      },
      settings: {
        currency: 'USD',
        precision: 2,
      },
    });
  });

  it('forwards source changes from wrappers and compose settings to the real field node', async () => {
    const { wrapperChanges, fieldChanges } = splitComposeFieldChanges(
      {
        label: 'Amount',
        sourceBinding: {
          entryId: 'entry_new',
        },
        settings: {
          currency: 'USD',
        },
      },
      'FormItemModel',
    );
    expect(wrapperChanges).toEqual({ label: 'Amount' });
    expect(fieldChanges).toEqual({
      sourceBinding: {
        entryId: 'entry_new',
      },
      settings: {
        currency: 'USD',
      },
    });

    const service = new FlowSurfacesService({ db: {} } as ConstructorParameters<typeof FlowSurfacesService>[0]);
    vi.spyOn(service as any, 'resolveEnabledPluginPackages').mockResolvedValue(new Set());
    vi.spyOn(service as any, 'resolveTitleFieldSyncDecision').mockResolvedValue({
      shouldSync: false,
      titleField: undefined,
    });
    vi.spyOn(service as any, 'updateSettings').mockResolvedValue({ uid: 'wrapper-1' });
    vi.spyOn(service as any, 'configureFieldNode').mockResolvedValue({ uid: 'field-1' });

    await (service as any).configureFieldWrapper(
      { uid: 'wrapper-1' },
      {
        uid: 'wrapper-1',
        use: 'FormItemModel',
        subModels: {
          field: {
            uid: 'field-1',
            use: 'JSEditableFieldModel',
          },
        },
      },
      fieldChanges,
      {},
    );

    expect((service as any).configureFieldNode).toHaveBeenCalledWith(
      { uid: 'field-1' },
      fieldChanges,
      expect.objectContaining({ enabledPackages: expect.any(Set) }),
    );
  });

  it('clears the active binding when switching inline while retaining fallback code and settings', () => {
    const nextStepParams = {
      jsSettings: {
        runJs: {
          ...currentRunJs,
          sourceMode: 'inline',
        },
      },
    };

    clearInactiveRunJsSourceBinding(
      'JSEditableFieldModel',
      {
        jsSettings: {
          runJs: {
            sourceMode: 'inline',
          },
        },
      },
      nextStepParams,
    );

    expect(nextStepParams.jsSettings.runJs).toEqual({
      code: currentRunJs.code,
      version: currentRunJs.version,
      sourceMode: 'inline',
      settings: currentRunJs.settings,
    });
  });

  it('allows semantic configure to switch a currently bound field back to inline', async () => {
    const service = new FlowSurfacesService({ db: {} } as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const current = {
      uid: 'field-1',
      use: 'JSFieldModel',
      stepParams: {
        jsSettings: {
          runJs: currentRunJs,
        },
      },
    };
    vi.spyOn(service as any, 'resolveEnabledPluginPackages').mockResolvedValue(new Set());
    vi.spyOn(service as any, 'locator', 'get').mockReturnValue({
      resolve: vi.fn().mockResolvedValue({ uid: 'field-1', kind: 'model' }),
      resolveCollectionContext: vi.fn().mockRejectedValue(new Error('no collection context')),
    });
    vi.spyOn(service as any, 'loadResolvedNode').mockResolvedValue(current);
    vi.spyOn(service as any, 'resolvePopupBlockProfile').mockRejectedValue(new Error('not a popup'));
    const configureFieldNode = vi.spyOn(service as any, 'configureFieldNode').mockResolvedValue({ uid: 'field-1' });

    await service.configure({
      target: { uid: 'field-1' },
      changes: {
        sourceMode: 'inline',
      },
    });

    expect(configureFieldNode).toHaveBeenCalledWith(
      { uid: 'field-1' },
      { sourceMode: 'inline' },
      expect.objectContaining({ enabledPackages: expect.any(Set) }),
    );
  });

  it('treats a binding-only configure patch on an inline field as light-extension activation', async () => {
    const service = new FlowSurfacesService({ db: {} } as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const current = {
      uid: 'field-1',
      use: 'JSFieldModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: "ctx.render('fallback');",
            version: 'v2',
            sourceMode: 'inline',
          },
        },
      },
    };
    vi.spyOn(service as any, 'resolveEnabledPluginPackages').mockResolvedValue(new Set());
    vi.spyOn(service as any, 'locator', 'get').mockReturnValue({
      resolve: vi.fn().mockResolvedValue({ uid: 'field-1', kind: 'model' }),
      resolveCollectionContext: vi.fn().mockRejectedValue(new Error('no collection context')),
    });
    vi.spyOn(service as any, 'loadResolvedNode').mockResolvedValue(current);
    vi.spyOn(service as any, 'resolvePopupBlockProfile').mockRejectedValue(new Error('not a popup'));
    const configureFieldNode = vi.spyOn(service as any, 'configureFieldNode').mockResolvedValue({ uid: 'field-1' });
    const sourceBinding = {
      type: 'light-extension-entry',
      repoId: 'repo_fields',
      entryId: 'entry_new',
      kind: 'js-field',
    };

    await service.configure({
      target: { uid: 'field-1' },
      changes: {
        sourceBinding,
      },
    });

    expect(configureFieldNode).toHaveBeenCalledWith(
      { uid: 'field-1' },
      { sourceBinding },
      expect.objectContaining({ enabledPackages: expect.any(Set) }),
    );
    expect(buildRunJsSourceChanges({ sourceBinding })).toEqual({
      sourceMode: 'light-extension',
      sourceBinding,
    });
  });
});
