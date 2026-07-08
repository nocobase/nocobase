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
import { getConfigureOptionsForUse } from '../flow-surfaces/configure-options';
import { FlowSurfacesService } from '../flow-surfaces/service';

const JS_ITEM_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_customers',
  entryId: 'entry_show_level_label',
  kind: 'js-item',
  publicationId: 'publication_show_level_label_v1',
  versionPolicy: 'pinned',
};

type ConfigureJSItemForTest = {
  configureJSItem(
    target: { uid: string },
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
};

type ConfigureActionNodeForTest = {
  configureActionNode(
    target: { uid: string },
    use: string,
    changes: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<unknown>;
};

describe('flowSurfaces JS item light-extension unit contract', () => {
  it('should expose JS item source binding options and contract paths', () => {
    const jsItemOptions = getConfigureOptionsForUse('JSItemModel');
    const jsItemActionOptions = getConfigureOptionsForUse('JSItemActionModel');
    const jsItemPaths = getNodeContract('JSItemModel').domains.stepParams?.groups?.jsSettings?.allowedPaths || [];
    const jsItemActionPaths =
      getNodeContract('JSItemActionModel').domains.stepParams?.groups?.jsSettings?.allowedPaths || [];

    expect(jsItemOptions).toEqual(
      expect.objectContaining({
        sourceMode: expect.objectContaining({
          type: 'string',
          enum: ['inline', 'light-extension'],
        }),
        sourceBinding: expect.objectContaining({
          type: 'object',
        }),
        settings: expect.objectContaining({
          type: 'object',
        }),
      }),
    );
    expect(jsItemActionOptions).toEqual(
      expect.objectContaining({
        sourceMode: expect.objectContaining({
          type: 'string',
          enum: ['inline', 'light-extension'],
        }),
        sourceBinding: expect.objectContaining({
          type: 'object',
        }),
        settings: expect.objectContaining({
          type: 'object',
        }),
      }),
    );
    expect(jsItemPaths).toEqual(
      expect.arrayContaining(['sourceBinding', 'settings.*', 'runJs.sourceMode', 'runJs.sourceBinding']),
    );
    expect(jsItemActionPaths).toEqual(
      expect.arrayContaining(['sourceBinding', 'settings.*', 'runJs.sourceMode', 'runJs.sourceBinding']),
    );
  });

  it('should map JS item source settings into runJs and top-level source storage', async () => {
    const service = new FlowSurfacesService({
      db: {},
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'js-item-1' });
    const target = { uid: 'js-item-1' };

    await (service as unknown as ConfigureJSItemForTest).configureJSItem(
      target,
      {
        sourceMode: 'light-extension',
        sourceBinding: JS_ITEM_SOURCE_BINDING,
        settings: {
          vipColor: '#d4380d',
        },
      },
      {},
    );

    expect(updateSettings).toHaveBeenCalledWith(
      {
        target,
        props: {},
        decoratorProps: {},
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'light-extension',
              sourceBinding: JS_ITEM_SOURCE_BINDING,
              settings: {
                vipColor: '#d4380d',
              },
            },
            sourceMode: 'light-extension',
            sourceBinding: JS_ITEM_SOURCE_BINDING,
            settings: {
              vipColor: '#d4380d',
            },
          },
        },
      },
      {},
    );
  });

  it('should map JS item action source settings into jsSettings instead of clickSettings', async () => {
    const service = new FlowSurfacesService({
      db: {},
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'js-item-action-1' });
    const target = { uid: 'js-item-action-1' };

    await (service as unknown as ConfigureActionNodeForTest).configureActionNode(
      target,
      'JSItemActionModel',
      {
        sourceMode: 'light-extension',
        sourceBinding: JS_ITEM_SOURCE_BINDING,
        settings: {
          vipColor: '#d4380d',
        },
      },
      {
        current: {
          uid: 'js-item-action-1',
          use: 'JSItemActionModel',
        },
      },
    );

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        target,
        stepParams: {
          jsSettings: {
            runJs: {
              sourceMode: 'light-extension',
              sourceBinding: JS_ITEM_SOURCE_BINDING,
              settings: {
                vipColor: '#d4380d',
              },
            },
            sourceMode: 'light-extension',
            sourceBinding: JS_ITEM_SOURCE_BINDING,
            settings: {
              vipColor: '#d4380d',
            },
          },
        },
      }),
      expect.objectContaining({
        popupTemplateHostUid: 'js-item-action-1',
      }),
    );
    expect(updateSettings.mock.calls[0][0]?.stepParams?.clickSettings).toBeUndefined();
  });
});
