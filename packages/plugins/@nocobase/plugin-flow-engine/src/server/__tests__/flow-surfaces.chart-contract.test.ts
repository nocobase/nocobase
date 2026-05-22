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
import { buildBlockTree } from '../flow-surfaces/builder';

describe('flowSurfaces chart contract helpers', () => {
  it('should expose chart editable contract on stepParams only', () => {
    const contract = getNodeContract('ChartBlockModel');
    expect(contract.editableDomains).toContain('stepParams');
    expect(contract.editableDomains).not.toContain('decoratorProps');
    expect(contract.editableDomains).not.toContain('props');
    expect(contract.domains.stepParams?.groups?.cardSettings?.allowedPaths).toEqual(
      expect.arrayContaining([
        'titleDescription.title',
        'titleDescription.description',
        'blockHeight.heightMode',
        'blockHeight.height',
      ]),
    );
  });

  it('should publish public heightMode enum for chart configure options', () => {
    const options = getConfigureOptionsForUse('ChartBlockModel');
    expect(options.heightMode.enum).toEqual(['defaultHeight', 'specifyValue', 'fullHeight']);
    expect(options.heightMode.example).toBe('specifyValue');
  });

  it('should preserve explicit chart cardSettings when the block tree is created', () => {
    const node = buildBlockTree({
      type: 'chart',
      stepParams: {
        cardSettings: {
          titleDescription: {
            title: 'Created chart title',
            description: 'Created chart description',
          },
          blockHeight: {
            heightMode: 'specifyValue',
            height: 360,
          },
        },
      },
    });

    expect(node.stepParams?.cardSettings).toMatchObject({
      titleDescription: {
        title: 'Created chart title',
        description: 'Created chart description',
      },
      blockHeight: {
        heightMode: 'specifyValue',
        height: 360,
      },
    });
  });

  it('should not synthesize chart cardSettings from decoratorProps when chart block tree is created', () => {
    const node = buildBlockTree({
      type: 'chart',
      decoratorProps: {
        title: 'Legacy title',
        displayTitle: true,
        height: 360,
        heightMode: 'fixed',
      },
    });

    expect(node.stepParams?.cardSettings).toBeUndefined();
  });

  it('should canonicalize calendar popup props into stepParams when the block tree is created', () => {
    const node = buildBlockTree({
      type: 'calendar',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
      props: {
        quickCreatePopupSettings: {
          mode: 'dialog',
          size: 'large',
          tryTemplate: true,
        },
        eventPopupSettings: {
          mode: 'drawer',
          size: 'small',
        },
      },
    });

    expect(node.stepParams?.calendarSettings?.quickCreatePopupSettings).toMatchObject({
      mode: 'dialog',
      size: 'large',
      tryTemplate: true,
    });
    expect(node.stepParams?.calendarSettings?.eventPopupSettings).toMatchObject({
      mode: 'drawer',
      size: 'small',
    });
    expect(node.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expect(node.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).not.toHaveProperty('tryTemplate');
  });

  it('should canonicalize kanban popup props into block and item stepParams when the block tree is created', () => {
    const node = buildBlockTree({
      type: 'kanban',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
      props: {
        popupMode: 'dialog',
        popupSize: 'large',
        popupTemplateUid: 'quick-create-template',
        popupTargetUid: 'quick-create-popup',
        cardOpenMode: 'drawer',
        cardPopupSize: 'small',
        cardPopupTemplateUid: 'card-template',
        cardPopupTargetUid: 'card-popup',
      },
    });

    expect(node.props).not.toHaveProperty('popupMode');
    expect(node.props).not.toHaveProperty('popupSize');
    expect(node.props).not.toHaveProperty('popupTemplateUid');
    expect(node.props).not.toHaveProperty('popupTargetUid');
    expect(node.props).not.toHaveProperty('quickCreatePopupSettings');
    expect(node.props).not.toHaveProperty('cardPopupTemplateUid');
    expect(node.stepParams?.kanbanSettings?.popup).toMatchObject({
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: 'quick-create-template',
      uid: 'quick-create-popup',
    });
    expect(node.stepParams?.cardSettings || {}).not.toHaveProperty('popup');
    expect(node.subModels?.item?.stepParams?.cardSettings?.popup).toMatchObject({
      mode: 'drawer',
      size: 'small',
      popupTemplateUid: 'card-template',
      uid: 'card-popup',
    });
    expect(node.subModels?.quickCreateAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'dialog',
      size: 'large',
      popupTemplateUid: 'quick-create-template',
      uid: 'quick-create-popup',
    });
    expect(node.subModels?.cardViewAction?.stepParams?.popupSettings?.openView).toMatchObject({
      mode: 'drawer',
      size: 'small',
      popupTemplateUid: 'card-template',
      uid: 'card-popup',
    });
  });

  it('should collect chart uids from a removed subtree before deleting flowSql bindings', async () => {
    const destroy = vi.fn();
    const service = new FlowSurfacesService({
      db: {
        getRepository: (name: string) => {
          if (name === 'flowSql') {
            return { destroy };
          }
          throw new Error(`unexpected repository: ${name}`);
        },
      },
    } as any);

    await (service as any).removeFlowSqlBindingsForNodeTree({
      uid: 'grid-root',
      use: 'BlockGridModel',
      subModels: {
        items: [
          {
            uid: 'chart-a',
            use: 'ChartBlockModel',
          },
          {
            uid: 'markdown-a',
            use: 'MarkdownBlockModel',
          },
          {
            uid: 'popup-page',
            use: 'ChildPageModel',
            subModels: {
              tabs: [
                {
                  uid: 'popup-tab',
                  use: 'ChildPageTabModel',
                  subModels: {
                    grid: {
                      uid: 'popup-grid',
                      use: 'BlockGridModel',
                      subModels: {
                        items: [
                          {
                            uid: 'chart-b',
                            use: 'ChartBlockModel',
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });

    expect(destroy).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenNthCalledWith(1, {
      filterByTk: 'chart-a',
      transaction: undefined,
    });
    expect(destroy).toHaveBeenNthCalledWith(2, {
      filterByTk: 'chart-b',
      transaction: undefined,
    });
  });
});
