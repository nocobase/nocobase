/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { buildRunJsSourceChanges, splitComposeFieldChanges } from '../flow-surfaces/service-utils';

type SourceKind = 'js-block' | 'js-field' | 'js-action' | 'js-item';
type SettingsGroup = 'jsSettings' | 'clickSettings';

type DispatcherService = {
  configureJSBlock(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  configureJSColumn(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  configureJSItem(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  configureActionNode(
    target: { uid: string },
    use: string,
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  configureFieldWrapper(
    target: { uid: string },
    current: Record<string, unknown>,
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  configureFieldNode(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
  loadResolvedNode(resolved: unknown): Promise<unknown>;
  resolveEnabledPluginPackages(options: Record<string, unknown>): Promise<ReadonlySet<string>>;
  resolvePopupBlockProfile(): Promise<unknown>;
  resolveTitleFieldSyncDecision(): Promise<{ shouldSync: boolean; titleField: undefined }>;
};

type UpdatePayload = {
  stepParams?: Partial<Record<SettingsGroup, { runJs?: Record<string, unknown> }>>;
};

function sourceBinding(kind: SourceKind) {
  return {
    type: 'light-extension-entry',
    repoId: `repo_${kind}`,
    entryId: `entry_${kind}`,
    kind,
  };
}

function createService() {
  const service = new FlowSurfacesService({ db: {} } as ConstructorParameters<typeof FlowSurfacesService>[0]);
  return {
    service,
    dispatcher: service as unknown as DispatcherService,
  };
}

describe('flowSurfaces JS source dispatcher matrix', () => {
  it.each([
    {
      name: 'JS block',
      kind: 'js-block' as const,
      group: 'jsSettings' as const,
      invoke: (service: DispatcherService, target: { uid: string }, changes: Record<string, unknown>) =>
        service.configureJSBlock(target, changes, {}),
    },
    {
      name: 'JS column',
      kind: 'js-field' as const,
      group: 'jsSettings' as const,
      bindingOnly: true,
      invoke: (service: DispatcherService, target: { uid: string }, changes: Record<string, unknown>) =>
        service.configureJSColumn(target, changes, {}),
    },
    {
      name: 'JS item',
      kind: 'js-item' as const,
      group: 'jsSettings' as const,
      invoke: (service: DispatcherService, target: { uid: string }, changes: Record<string, unknown>) =>
        service.configureJSItem(target, changes, {}),
    },
    {
      name: 'JS item action',
      kind: 'js-item' as const,
      group: 'jsSettings' as const,
      invoke: (service: DispatcherService, target: { uid: string }, changes: Record<string, unknown>) =>
        service.configureActionNode(target, 'JSItemActionModel', changes, {
          current: { uid: target.uid, use: 'JSItemActionModel' },
        }),
    },
    {
      name: 'JS action',
      kind: 'js-action' as const,
      group: 'clickSettings' as const,
      invoke: (service: DispatcherService, target: { uid: string }, changes: Record<string, unknown>) =>
        service.configureActionNode(target, 'JSActionModel', changes, {
          current: { uid: target.uid, use: 'JSActionModel' },
        }),
    },
  ])('writes $name source settings only to its canonical runJs group', async (caseItem) => {
    const { service, dispatcher } = createService();
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'surface-1' });
    const target = { uid: `surface-${caseItem.kind}` };
    const binding = sourceBinding(caseItem.kind);
    const changes = {
      ...(!('bindingOnly' in caseItem && caseItem.bindingOnly) ? { sourceMode: 'light-extension' } : {}),
      sourceBinding: binding,
      settings: { locale: 'en-US' },
    };

    await caseItem.invoke(dispatcher, target, changes);

    const payload = updateSettings.mock.calls[0][0] as UpdatePayload;
    expect(payload.stepParams?.[caseItem.group]?.runJs).toEqual({
      sourceMode: 'light-extension',
      sourceBinding: binding,
      settings: { locale: 'en-US' },
    });
    const otherGroup: SettingsGroup = caseItem.group === 'jsSettings' ? 'clickSettings' : 'jsSettings';
    expect(payload.stepParams?.[otherGroup]).toBeUndefined();
    expect(payload.stepParams).not.toHaveProperty('sourceMode');
    expect(payload.stepParams).not.toHaveProperty('sourceBinding');
    expect(payload.stepParams).not.toHaveProperty('settings');
    if ('bindingOnly' in caseItem && caseItem.bindingOnly) {
      expect(payload.stepParams?.[caseItem.group]?.runJs).not.toHaveProperty('code');
    }
  });

  it('forwards wrapper source changes to the persisted JS field node', async () => {
    const { service, dispatcher } = createService();
    const { wrapperChanges, fieldChanges } = splitComposeFieldChanges(
      {
        label: 'Amount',
        sourceBinding: { entryId: 'entry_new' },
        settings: { currency: 'USD' },
      },
      'FormItemModel',
    );
    expect(wrapperChanges).toEqual({ label: 'Amount' });
    expect(fieldChanges).toEqual({
      sourceBinding: { entryId: 'entry_new' },
      settings: { currency: 'USD' },
    });

    vi.spyOn(dispatcher, 'resolveEnabledPluginPackages').mockResolvedValue(new Set());
    vi.spyOn(dispatcher, 'resolveTitleFieldSyncDecision').mockResolvedValue({
      shouldSync: false,
      titleField: undefined,
    });
    vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'wrapper-1' });
    const configureFieldNode = vi.spyOn(dispatcher, 'configureFieldNode').mockResolvedValue({ uid: 'field-1' });

    await dispatcher.configureFieldWrapper(
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

    expect(configureFieldNode).toHaveBeenCalledWith(
      { uid: 'field-1' },
      fieldChanges,
      expect.objectContaining({ enabledPackages: expect.any(Set) }),
    );
  });

  it.each([
    {
      name: 'detach a bound field',
      currentRunJs: {
        code: "ctx.render('fallback');",
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: sourceBinding('js-field'),
      },
      changes: { sourceMode: 'inline' },
    },
    {
      name: 'activate an inline field from a binding-only patch',
      currentRunJs: {
        code: "ctx.render('fallback');",
        version: 'v2',
        sourceMode: 'inline',
      },
      changes: { sourceBinding: sourceBinding('js-field') },
    },
  ])('routes configure to the JS field dispatcher when it must $name', async ({ currentRunJs, changes }) => {
    const { service, dispatcher } = createService();
    const current = {
      uid: 'field-1',
      use: 'JSFieldModel',
      stepParams: {
        jsSettings: { runJs: currentRunJs },
      },
    };
    vi.spyOn(dispatcher, 'resolveEnabledPluginPackages').mockResolvedValue(new Set());
    vi.spyOn(service, 'locator', 'get').mockReturnValue({
      resolve: vi.fn().mockResolvedValue({ uid: 'field-1', kind: 'model' }),
      resolveCollectionContext: vi.fn().mockRejectedValue(new Error('no collection context')),
    } as never);
    vi.spyOn(dispatcher, 'loadResolvedNode').mockResolvedValue(current);
    vi.spyOn(dispatcher, 'resolvePopupBlockProfile').mockRejectedValue(new Error('not a popup'));
    const configureFieldNode = vi.spyOn(dispatcher, 'configureFieldNode').mockResolvedValue({ uid: 'field-1' });

    await service.configure({ target: { uid: 'field-1' }, changes });

    expect(configureFieldNode).toHaveBeenCalledWith(
      { uid: 'field-1' },
      changes,
      expect.objectContaining({ enabledPackages: expect.any(Set) }),
    );
    expect(buildRunJsSourceChanges(changes)).toMatchObject(
      Object.prototype.hasOwnProperty.call(changes, 'sourceBinding')
        ? { sourceMode: 'light-extension', sourceBinding: sourceBinding('js-field') }
        : { sourceMode: 'inline' },
    );
  });
});
