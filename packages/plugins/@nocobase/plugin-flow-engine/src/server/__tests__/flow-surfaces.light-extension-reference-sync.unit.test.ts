/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  markLightExtensionReferencesOwnerMissingForNodeTree,
  syncLightExtensionReferencesForNodeTree,
} from '../flow-surfaces/light-extension-reference-integration';
import { resolveRunJsSettingsGroupKey, shouldSyncLightExtensionReferences } from '../flow-surfaces/service';

function options(use: string, sourceMode: string, settings: Record<string, unknown> = {}) {
  const groupKey = resolveRunJsSettingsGroupKey(use);
  if (!groupKey) {
    throw new Error(`Missing RunJS settings group for ${use}`);
  }
  return {
    use,
    stepParams: {
      [groupKey]: {
        runJs: {
          sourceMode,
          settings,
        },
      },
    },
  };
}

const JS_OWNER_USES = [
  'JSBlockModel',
  'JSItemModel',
  'FormJSFieldItemModel',
  'JSItemActionModel',
  'JSFieldModel',
  'JSEditableFieldModel',
  'JSColumnModel',
  'JSActionModel',
  'JSRecordActionModel',
  'JSCollectionActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
];

function inlineCodeOptions(use: string, code: string) {
  const groupKey = resolveRunJsSettingsGroupKey(use);
  if (!groupKey) {
    throw new Error(`Missing RunJS settings group for ${use}`);
  }
  return {
    use,
    stepParams: {
      [groupKey]: {
        runJs: {
          code,
          version: 'v2',
        },
      },
    },
  };
}

describe('flowSurfaces light-extension reference sync', () => {
  it('maps every public JS owner use to its canonical settings group', () => {
    for (const use of JS_OWNER_USES.slice(0, 7)) {
      expect(resolveRunJsSettingsGroupKey(use), use).toBe('jsSettings');
    }
    for (const use of JS_OWNER_USES.slice(7)) {
      expect(resolveRunJsSettingsGroupKey(use), use).toBe('clickSettings');
    }
  });

  it('syncs activation, settings updates, and inline cleanup but ignores unrelated nodes', () => {
    expect(
      shouldSyncLightExtensionReferences(options('JSFieldModel', 'inline'), options('JSFieldModel', 'light-extension')),
    ).toBe(true);
    expect(
      shouldSyncLightExtensionReferences(
        options('JSColumnModel', 'light-extension', { currency: 'CNY' }),
        options('JSColumnModel', 'light-extension', { currency: 'USD' }),
      ),
    ).toBe(true);
    expect(
      shouldSyncLightExtensionReferences(options('JSItemModel', 'light-extension'), options('JSItemModel', 'inline')),
    ).toBe(true);
    expect(
      shouldSyncLightExtensionReferences(
        {
          ...options('JSFieldModel', 'inline'),
          stepParams: {
            jsSettings: {
              runJs: {
                sourceMode: 'inline',
                code: "ctx.render('before');",
              },
            },
          },
        },
        {
          ...options('JSFieldModel', 'inline'),
          stepParams: {
            jsSettings: {
              runJs: {
                sourceMode: 'inline',
                code: "ctx.render('after');",
              },
            },
          },
        },
      ),
    ).toBe(false);
    expect(shouldSyncLightExtensionReferences({ use: 'InputFieldModel' }, { use: 'InputFieldModel' })).toBe(false);
  });

  it('does not enter reference integration for inline code-only updates on any JS owner use', () => {
    for (const use of JS_OWNER_USES) {
      expect(
        shouldSyncLightExtensionReferences(
          inlineCodeOptions(use, 'return "before";'),
          inlineCodeOptions(use, 'return "after";'),
        ),
        use,
      ).toBe(false);
    }
  });

  it('is a safe no-op without the plugin and delegates when the provider is enabled', async () => {
    await expect(
      syncLightExtensionReferencesForNodeTree({ app: { pm: {} } }, { rootUid: 'root' }),
    ).resolves.toBeUndefined();
    await expect(
      syncLightExtensionReferencesForNodeTree(
        {
          app: {
            pm: {
              get: () => {
                throw new Error('plugin is not enabled');
              },
            },
          },
        },
        { rootUid: 'root' },
      ),
    ).resolves.toBeUndefined();

    const sync = vi.fn().mockResolvedValue(undefined);
    const markMissing = vi.fn().mockResolvedValue(undefined);
    const plugin = {
      app: {
        pm: {
          get: () => ({
            syncFlowModelReferencesForNodeTree: sync,
            markFlowModelReferencesOwnerMissingForNodeTree: markMissing,
          }),
        },
      },
    };
    await syncLightExtensionReferencesForNodeTree(plugin, { rootUid: 'root', action: 'flowSurfaces.configure' });
    await markLightExtensionReferencesOwnerMissingForNodeTree(plugin, {
      rootUid: 'root',
      action: 'flowSurfaces.removeNode',
    });

    expect(sync).toHaveBeenCalledWith({ rootUid: 'root', action: 'flowSurfaces.configure' }, {});
    expect(markMissing).toHaveBeenCalledWith({ rootUid: 'root', action: 'flowSurfaces.removeNode' }, {});
  });
});
