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

describe('flow surface template readback', () => {
  function createService(findModelByParentId = vi.fn()) {
    return new FlowSurfacesService({
      db: {
        getCollection: vi.fn(() => ({
          repository: {
            findModelByParentId,
          },
        })),
      },
    } as any);
  }

  it('should decorate already-loaded trees without probing popup children for every node', async () => {
    const findModelByParentId = vi.fn(async () => {
      throw new Error('unexpected popup child lookup');
    });
    const service = createService(findModelByParentId);
    const tree = {
      uid: 'page',
      use: 'RootPageModel',
      subModels: {
        tabs: [
          {
            uid: 'tab',
            use: 'RootPageTabModel',
            subModels: {
              grid: {
                uid: 'grid',
                use: 'GridModel',
                subModels: {
                  blocks: [
                    {
                      uid: 'block',
                      use: 'MarkdownBlockModel',
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    };

    await (service as any).decorateTemplateReadbackTree(tree);

    expect(tree.subModels.tabs[0].subModels.grid.subModels.blocks[0].popup).toBeUndefined();
    expect(findModelByParentId).not.toHaveBeenCalled();
  });

  it('should summarize loaded local popup children without database fallback', async () => {
    const findModelByParentId = vi.fn(async () => {
      throw new Error('unexpected popup child lookup');
    });
    const service = createService(findModelByParentId);
    const tree = {
      uid: 'action',
      use: 'ActionModel',
      subModels: {
        page: {
          uid: 'popup-page',
          use: 'PopupPageModel',
          subModels: {
            tabs: [
              {
                uid: 'popup-tab',
                use: 'PopupTabModel',
                subModels: {
                  grid: {
                    uid: 'popup-grid',
                    use: 'GridModel',
                  },
                },
              },
            ],
          },
        },
      },
    };

    await (service as any).decorateTemplateReadbackTree(tree);

    expect(tree).toMatchObject({
      popup: {
        mode: 'local',
        pageUid: 'popup-page',
        tabUid: 'popup-tab',
        gridUid: 'popup-grid',
      },
    });
    expect(findModelByParentId).not.toHaveBeenCalled();
  });
});
