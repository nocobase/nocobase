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
  markJsTemplateUsagesOwnerMissingForNodeTree,
  syncJsTemplateUsagesForNodeTree,
} from '../flow-surfaces/js-template-usage-integration';
import {
  assertNoDirectJsTemplateDetach,
  resolveRunJsSettingsGroupKey,
  shouldSyncJsTemplateUsages,
} from '../flow-surfaces/service';

function createOptions(use: string, sourceMode: string, settings: Record<string, unknown> = {}) {
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
  'JSPageModel',
  'JSItemModel',
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

describe('flowSurfaces js-template usage sync', () => {
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
      shouldSyncJsTemplateUsages(createOptions('JSFieldModel', 'inline'), createOptions('JSFieldModel', 'js-template')),
    ).toBe(true);
    expect(
      shouldSyncJsTemplateUsages(
        createOptions('JSColumnModel', 'js-template', { currency: 'CNY' }),
        createOptions('JSColumnModel', 'js-template', { currency: 'USD' }),
      ),
    ).toBe(true);
    expect(
      shouldSyncJsTemplateUsages(createOptions('JSItemModel', 'js-template'), createOptions('JSItemModel', 'inline')),
    ).toBe(true);
    expect(
      shouldSyncJsTemplateUsages(
        {
          ...createOptions('JSFieldModel', 'inline'),
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
          ...createOptions('JSFieldModel', 'inline'),
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
    expect(shouldSyncJsTemplateUsages({ use: 'InputFieldModel' }, { use: 'InputFieldModel' })).toBe(false);
  });

  it('does not enter usage integration for inline code-only updates on any JS owner use', () => {
    for (const use of JS_OWNER_USES) {
      expect(
        shouldSyncJsTemplateUsages(
          inlineCodeOptions(use, 'return "before";'),
          inlineCodeOptions(use, 'return "after";'),
        ),
        use,
      ).toBe(false);
    }
  });

  it('requires the canonical detach operation for every JS Template Host kind', () => {
    for (const use of JS_OWNER_USES) {
      expect(() =>
        assertNoDirectJsTemplateDetach(createOptions(use, 'js-template'), createOptions(use, 'inline')),
      ).toThrow(
        expect.objectContaining({
          code: 'FLOW_SURFACE_JS_TEMPLATE_DETACH_REQUIRED',
          status: 409,
        }),
      );
      expect(() =>
        assertNoDirectJsTemplateDetach(createOptions(use, 'js-template'), createOptions(use, 'js-template')),
      ).not.toThrow();
    }
  });

  it('is a safe no-op without the plugin and delegates when the provider is enabled', async () => {
    await expect(syncJsTemplateUsagesForNodeTree({ app: { pm: {} } }, { rootUid: 'root' })).resolves.toBeUndefined();
    await expect(
      syncJsTemplateUsagesForNodeTree(
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
            syncJsTemplateUsagesForNodeTree: sync,
            markJsTemplateUsagesOwnerMissingForNodeTree: markMissing,
          }),
        },
      },
    };
    await syncJsTemplateUsagesForNodeTree(plugin, { rootUid: 'root', action: 'flowSurfaces.configure' });
    await markJsTemplateUsagesOwnerMissingForNodeTree(plugin, {
      rootUid: 'root',
      action: 'flowSurfaces.removeNode',
    });

    expect(sync).toHaveBeenCalledWith({ rootUid: 'root', action: 'flowSurfaces.configure' }, {});
    expect(markMissing).toHaveBeenCalledWith({ rootUid: 'root', action: 'flowSurfaces.removeNode' }, {});
  });
});
