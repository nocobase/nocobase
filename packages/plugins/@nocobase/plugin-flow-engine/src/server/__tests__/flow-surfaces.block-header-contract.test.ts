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

  it('should publish map height configure options and persist them through decoratorProps writes', async () => {
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
        decoratorProps: {
          height: 420,
          heightMode: 'fullHeight',
        },
        stepParams: {
          cardSettings: {
            titleDescription: {
              title: 'Map block title',
              description: 'Map block description',
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

  it('should mirror and refresh raw map height props in decoratorProps during updateSettings normalization', () => {
    const service = new FlowSurfacesService({ db: {} } as any);
    const nextPayload = {
      props: {
        height: 360,
        heightMode: 'specifyValue',
      },
      decoratorProps: {
        height: 240,
        heightMode: 'defaultHeight',
      },
    };

    (service as any).syncMapHeightChromeForUpdateSettings(
      {
        use: 'MapBlockModel',
      },
      nextPayload,
    );

    expect(nextPayload).toMatchObject({
      props: {
        height: 360,
        heightMode: 'specifyValue',
      },
      decoratorProps: {
        height: 360,
        heightMode: 'specifyValue',
      },
    });
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
