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
import { getReactionKindsForUse } from '../flow-surfaces/reaction/registry';
import { FlowSurfacesService } from '../flow-surfaces/service';

describe('flowSurfaces block header contracts', () => {
  it('should expose canonical titleDescription paths and reject legacy raw block title props', () => {
    const contractCases = [
      'TableBlockModel',
      'FormBlockModel',
      'CreateFormModel',
      'EditFormModel',
      'DetailsBlockModel',
      'ApplyFormModel',
      'ProcessFormModel',
      'ApprovalDetailsModel',
      'ApplyTaskCardDetailsModel',
      'ApprovalTaskCardDetailsModel',
      'ListBlockModel',
      'GridCardBlockModel',
      'MarkdownBlockModel',
      'IframeBlockModel',
      'ChartBlockModel',
      'ActionPanelBlockModel',
      'MapBlockModel',
      'CommentsBlockModel',
    ];

    for (const use of contractCases) {
      const contract = getNodeContract(use);
      const propsAllowedKeys = contract.domains.props?.allowedKeys || [];
      const decoratorAllowedKeys = contract.domains.decoratorProps?.allowedKeys || [];
      const cardSettingsAllowedPaths = contract.domains.stepParams?.groups?.cardSettings?.allowedPaths || [];

      expect(cardSettingsAllowedPaths).toEqual(
        expect.arrayContaining(['titleDescription.title', 'titleDescription.description']),
      );
      expect(propsAllowedKeys).not.toContain('title');
      expect(propsAllowedKeys).not.toContain('displayTitle');
      expect(decoratorAllowedKeys).not.toContain('title');
      expect(decoratorAllowedKeys).not.toContain('description');
    }
  });

  it('should publish block description configure options without block-level displayTitle', () => {
    const optionCases = [
      'TableBlockModel',
      'FormBlockModel',
      'EditFormModel',
      'ApplyFormModel',
      'ProcessFormModel',
      'DetailsBlockModel',
      'ApprovalDetailsModel',
      'ApplyTaskCardDetailsModel',
      'ApprovalTaskCardDetailsModel',
      'ListBlockModel',
      'GridCardBlockModel',
      'MarkdownBlockModel',
      'IframeBlockModel',
      'ChartBlockModel',
      'ActionPanelBlockModel',
      'MapBlockModel',
      'CommentsBlockModel',
    ];

    for (const use of optionCases) {
      const options = getConfigureOptionsForUse(use);
      expect(options).toEqual(
        expect.objectContaining({
          title: expect.any(Object),
          description: expect.any(Object),
        }),
      );
      expect(options).not.toHaveProperty('displayTitle');
    }
  });

  it('should expose block linkage cardSettings and reaction capabilities for markdown and iframe blocks', () => {
    for (const use of ['MarkdownBlockModel', 'IframeBlockModel']) {
      const contract = getNodeContract(use);
      const cardSettingsAllowedPaths = contract.domains.stepParams?.groups?.cardSettings?.allowedPaths || [];

      expect(cardSettingsAllowedPaths).toEqual(
        expect.arrayContaining(['titleDescription.title', 'titleDescription.description', 'linkageRules']),
      );
      expect(getReactionKindsForUse(use)).toEqual(expect.arrayContaining(['blockLinkage']));
    }
  });

  it('should expose canonical blockHeight paths and reject legacy raw block height props', () => {
    const blockHeightCases = [
      'TableBlockModel',
      'CalendarBlockModel',
      'TreeBlockModel',
      'KanbanBlockModel',
      'ListBlockModel',
      'GridCardBlockModel',
      'MapBlockModel',
    ];

    for (const use of blockHeightCases) {
      const contract = getNodeContract(use);
      const propsAllowedKeys = contract.domains.props?.allowedKeys || [];
      const decoratorAllowedKeys = contract.domains.decoratorProps?.allowedKeys || [];
      const cardSettingsAllowedPaths = contract.domains.stepParams?.groups?.cardSettings?.allowedPaths || [];

      expect(cardSettingsAllowedPaths).toEqual(
        expect.arrayContaining(['blockHeight.heightMode', 'blockHeight.height']),
      );
      expect(propsAllowedKeys).not.toContain('height');
      expect(propsAllowedKeys).not.toContain('heightMode');
      expect(decoratorAllowedKeys).not.toContain('height');
      expect(decoratorAllowedKeys).not.toContain('heightMode');
    }
  });

  it('should publish map height configure options and persist them through blockHeight cardSettings', async () => {
    const options = getConfigureOptionsForUse('MapBlockModel');
    expect(options.heightMode.enum).toEqual(['defaultHeight', 'specifyValue', 'fullHeight']);
    expect(options.heightMode.example).toBe('specifyValue');

    const service = new FlowSurfacesService({ db: {} } as any);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'map-1' } as any);

    await (service as any).configureMapBlock(
      { uid: 'block-1' },
      {
        title: 'Map block title',
        description: 'Map block description',
        height: 420,
        heightMode: 'fullHeight',
        zoom: 14,
      },
      {},
    );

    expect(updateSettings).toHaveBeenCalledWith(
      {
        target: { uid: 'block-1' },
        stepParams: {
          cardSettings: {
            titleDescription: {
              title: 'Map block title',
              description: 'Map block description',
            },
            blockHeight: {
              heightMode: 'fullHeight',
            },
          },
          createMapBlock: {
            mapZoom: {
              zoom: 14,
            },
          },
        },
      },
      {},
    );
  });

  it('should persist affected block height configure changes through blockHeight cardSettings', async () => {
    const service = new FlowSurfacesService({ db: {} } as any);
    vi.spyOn(service as any, 'getCalendarBlockResourceInit').mockReturnValue({
      dataSourceKey: 'main',
      collectionName: 'events',
    });
    vi.spyOn(service as any, 'assertCalendarCollectionCompatible').mockReturnValue({
      collection: {},
      collectionName: 'events',
    });
    vi.spyOn(service as any, 'normalizeCalendarFieldNamesForCollection').mockReturnValue({});
    vi.spyOn(service as any, 'ensureCalendarBlockPopupHosts').mockResolvedValue(undefined);
    vi.spyOn(service as any, 'repository', 'get').mockReturnValue({
      findModelById: vi.fn().mockResolvedValue({
        uid: 'calendar-1',
        props: {},
        stepParams: {},
      }),
    } as any);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'block-1' } as any);
    const cases: Array<{
      method: string;
      args: any[];
    }> = [
      {
        method: 'configureTableBlock',
        args: [{ uid: 'table-1' }, { title: 'Table', height: 500 }, {}],
      },
      {
        method: 'configureCalendarBlock',
        args: [
          { uid: 'calendar-1' },
          { uid: 'calendar-1', props: {}, stepParams: {} },
          { title: 'Calendar', height: 500 },
          {},
        ],
      },
      {
        method: 'configureTreeBlock',
        args: [{ uid: 'tree-1' }, { uid: 'tree-1', props: {}, stepParams: {} }, { title: 'Tree', height: 500 }, {}],
      },
      {
        method: 'configureListBlock',
        args: [{ uid: 'list-1' }, { title: 'List', height: 500 }, {}],
      },
      {
        method: 'configureGridCardBlock',
        args: [{ uid: 'grid-card-1' }, { title: 'Grid card', height: 500 }, {}],
      },
      {
        method: 'configureMapBlock',
        args: [{ uid: 'map-1' }, { title: 'Map', height: 500 }, {}],
      },
    ];

    for (const testCase of cases) {
      updateSettings.mockClear();
      await (service as any)[testCase.method](...testCase.args);

      expect(updateSettings).toHaveBeenCalledTimes(1);
      expect(updateSettings.mock.calls[0][0]).toMatchObject({
        stepParams: {
          cardSettings: {
            titleDescription: {
              title: expect.any(String),
            },
            blockHeight: {
              heightMode: 'specifyValue',
              height: 500,
            },
          },
        },
      });
      expect(updateSettings.mock.calls[0][0]).not.toHaveProperty('decoratorProps');
    }
  });

  it('should persist kanban block height configure changes without overwriting item cardSettings', async () => {
    const service = new FlowSurfacesService({ db: {} } as any);
    vi.spyOn(service as any, 'getKanbanBlockResourceInit').mockReturnValue({
      dataSourceKey: 'main',
      collectionName: 'tasks',
    });
    vi.spyOn(service as any, 'assertKanbanCollectionCompatible').mockReturnValue({
      collection: {},
      collectionName: 'tasks',
      dataSourceKey: 'main',
    });
    vi.spyOn(service as any, 'getKanbanDefaultGroupFieldName').mockReturnValue('status');
    vi.spyOn(service as any, 'getKanbanGroupField').mockReturnValue({ name: 'status', interface: 'select' });
    vi.spyOn(service as any, 'isKanbanGroupField').mockReturnValue(true);
    vi.spyOn(service as any, 'isKanbanAssociationGroupField').mockReturnValue(false);
    vi.spyOn(service as any, 'repository', 'get').mockReturnValue({
      findModelById: vi.fn().mockResolvedValue({
        uid: 'kanban-1',
        props: {},
        stepParams: {},
        subModels: { item: { uid: 'kanban-item-1' } },
      }),
    } as any);
    vi.spyOn(service as any, 'ensureKanbanBlockPopupHosts').mockResolvedValue(undefined);
    const updateSettings = vi.spyOn(service, 'updateSettings').mockResolvedValue({ uid: 'kanban-1' } as any);

    await (service as any).configureKanbanBlock(
      { uid: 'kanban-1' },
      {
        uid: 'kanban-1',
        props: {},
        stepParams: {
          cardSettings: {
            linkageRules: [{ id: 'keep-block-linkage' }],
          },
        },
        subModels: {
          item: {
            uid: 'kanban-item-1',
            stepParams: {
              cardSettings: {
                click: {
                  enableCardClick: true,
                },
              },
            },
          },
        },
      },
      {
        title: 'Kanban',
        height: 500,
      },
      {},
    );

    expect(updateSettings).toHaveBeenCalledTimes(1);
    expect(updateSettings.mock.calls[0][0]).toMatchObject({
      target: { uid: 'kanban-1' },
      stepParams: {
        cardSettings: {
          titleDescription: {
            title: 'Kanban',
          },
          blockHeight: {
            heightMode: 'specifyValue',
            height: 500,
          },
        },
      },
    });
    expect(updateSettings.mock.calls[0][0]).not.toHaveProperty('decoratorProps');
    expect(updateSettings.mock.calls[0][0].stepParams.cardSettings).not.toHaveProperty('click');
  });

  it('should accept raw canonical blockHeight writes and clear stale fixed height for default modes', async () => {
    const patch = vi.fn().mockResolvedValue(undefined);
    const service = new FlowSurfacesService({
      db: {
        getCollection: () => ({
          repository: {
            findModelById: vi.fn().mockResolvedValue({
              uid: 'table-1',
              use: 'TableBlockModel',
              props: {},
              decoratorProps: {},
              stepParams: {
                cardSettings: {
                  titleDescription: {
                    title: 'Existing title',
                  },
                  blockHeight: {
                    heightMode: 'specifyValue',
                    height: 500,
                  },
                  linkageRules: [{ id: 'keep-linkage' }],
                },
              },
            }),
            patch,
            findNodesById: vi.fn().mockResolvedValue([]),
          },
        }),
        getRepository: () => null,
      },
    } as any);
    const resolve = vi.fn().mockResolvedValue({ uid: 'table-1', kind: 'node' });
    vi.spyOn(service, 'locator', 'get').mockReturnValue({ resolve } as any);

    await service.updateSettings({
      target: { uid: 'table-1' },
      stepParams: {
        cardSettings: {
          blockHeight: {
            heightMode: 'defaultHeight',
            height: 500,
          },
        },
      },
    });

    expect(patch).toHaveBeenCalledWith(
      {
        uid: 'table-1',
        stepParams: {
          cardSettings: {
            titleDescription: {
              title: 'Existing title',
            },
            blockHeight: {
              heightMode: 'defaultHeight',
            },
            linkageRules: [{ id: 'keep-linkage' }],
          },
        },
      },
      { transaction: undefined },
    );
  });

  it('should route configure to map and comments block handlers', async () => {
    const service = new FlowSurfacesService({ db: {} } as any);
    const resolve = vi.fn().mockResolvedValue({ uid: 'block-1', kind: 'node' });
    vi.spyOn(service, 'locator', 'get').mockReturnValue({ resolve } as any);
    vi.spyOn(service as any, 'loadResolvedNode')
      .mockResolvedValueOnce({ uid: 'block-1', use: 'MapBlockModel' })
      .mockResolvedValueOnce({ uid: 'block-1', use: 'CommentsBlockModel' });
    const configureMapBlock = vi.spyOn(service as any, 'configureMapBlock').mockResolvedValue({ uid: 'map-1' });
    const configureCommentsBlock = vi
      .spyOn(service as any, 'configureCommentsBlock')
      .mockResolvedValue({ uid: 'comments-1' });

    const mapRes = await service.configure({
      target: { uid: 'block-1' },
      changes: { title: 'Map block title' },
    } as any);
    const commentsRes = await service.configure({
      target: { uid: 'block-1' },
      changes: { title: 'Comments block title' },
    } as any);

    expect(configureMapBlock).toHaveBeenCalledWith({ uid: 'block-1' }, { title: 'Map block title' }, {});
    expect(configureCommentsBlock).toHaveBeenCalledWith({ uid: 'block-1' }, { title: 'Comments block title' }, {});
    expect(mapRes).toEqual({ uid: 'map-1' });
    expect(commentsRes).toEqual({ uid: 'comments-1' });
  });
});
