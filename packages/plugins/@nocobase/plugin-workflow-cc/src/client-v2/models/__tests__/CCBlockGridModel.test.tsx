/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  addSubModelButton: vi.fn(),
  pmGet: vi.fn(),
  PluginWorkflowClientV2: class PluginWorkflowClientV2 {},
  usePluginValue: undefined as unknown,
}));

vi.mock('@nocobase/client-v2', () => ({
  BlockGridModel: class BlockGridModel {
    static define = vi.fn();
  },
  usePlugin: () => holder.usePluginValue,
}));

vi.mock('@nocobase/flow-engine', () => ({
  AddSubModelButton: (props: { children?: React.ReactNode; items?: unknown }) => {
    holder.addSubModelButton(props);
    return <div data-testid="add-sub-model-button">{props.children}</div>;
  },
  FlowSettingsButton: (props: { children?: React.ReactNode }) => <button>{props.children}</button>,
  useFlowEngine: () => ({
    context: {
      app: {
        pm: {
          get: holder.pmGet,
        },
      },
    },
  }),
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  PluginWorkflowClientV2: holder.PluginWorkflowClientV2,
}));

vi.mock('../../locale', () => ({
  tExpr: (key: string) => key,
}));

import { CCBlockGridModel } from '../CCBlockGridModel';

function createModel(workflowPlugin?: unknown) {
  holder.pmGet.mockImplementation((key: unknown) => {
    if (key === 'workflow' || key === '@nocobase/plugin-workflow' || key === holder.PluginWorkflowClientV2) {
      return workflowPlugin;
    }
    return undefined;
  });
  const model = new CCBlockGridModel();
  model.context = {
    flowSettingsEnabled: true,
    t: (key: string) => key,
    view: {
      inputArgs: {
        availableUpstreams: [],
        flowContext: {
          workflow: {
            config: { collection: 'main.orders' },
            type: 'approval',
          },
        },
      },
    },
  } as never;
  return model;
}

function renderAddButton(model: CCBlockGridModel) {
  render(<>{model.renderAddSubModelButton()}</>);
  return holder.addSubModelButton.mock.calls.at(-1)?.[0]?.items as Array<Record<string, unknown>>;
}

function getOriginalApplicationContentItem(items: Array<Record<string, unknown>>) {
  const dataBlocks = items.find((item) => item.key === 'dataBlocks') as { children: Array<Record<string, unknown>> };
  const triggers = dataBlocks.children.find((item) => item.key === 'triggers') as {
    children: Array<Record<string, unknown>>;
  };
  return triggers.children.find((item) => item.key === 'originalApplicationContent') as {
    createModelOptions: {
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: string;
            dataSourceKey: string;
          };
        };
      };
    };
  };
}

afterEach(() => {
  vi.clearAllMocks();
  holder.usePluginValue = undefined;
});

describe('CCBlockGridModel', () => {
  it('builds trigger data block menu items from a v1-style workflow plugin', () => {
    const triggerItem = {
      key: 'originalApplicationContent',
      label: 'Original application content',
      useModel: 'NodeDetailsModel',
    };
    const model = createModel({
      triggers: {
        get: (type: string) =>
          type === 'approval'
            ? {
                getCreateModelMenuItem: vi.fn(() => triggerItem),
              }
            : undefined,
      },
    });

    const items = renderAddButton(model);

    expect(items.map((item) => item.key)).toEqual(['dataBlocks', 'otherBlocks']);
    expect(items[0]).toEqual(
      expect.objectContaining({
        key: 'dataBlocks',
        children: [
          expect.objectContaining({
            key: 'triggers',
            label: '{{t("Trigger", { ns: "workflow" })}}',
            children: [triggerItem],
          }),
        ],
      }),
    );
  });

  it('builds trigger data block menu items from a v2-style workflow plugin', () => {
    const triggerItem = {
      key: 'originalApplicationContent',
      label: 'Original application content',
      useModel: 'NodeDetailsModel',
    };
    const model = createModel({
      getTriggerOptions: (type: string) =>
        type === 'approval'
          ? {
              getCreateModelMenuItem: vi.fn(() => [triggerItem]),
            }
          : undefined,
    });

    const items = renderAddButton(model);

    expect(items[0]).toEqual(
      expect.objectContaining({
        key: 'dataBlocks',
        children: [
          expect.objectContaining({
            key: 'triggers',
            label: '{{t("Trigger", { ns: "workflow" })}}',
            children: [triggerItem],
          }),
        ],
      }),
    );
  });

  it('omits data blocks instead of throwing when no workflow plugin is registered', () => {
    const model = createModel(undefined);

    const items = renderAddButton(model);

    expect(items.map((item) => item.key)).toEqual(['otherBlocks']);
    expect(items[0]).toEqual(
      expect.objectContaining({
        key: 'otherBlocks',
        children: [expect.objectContaining({ key: 'markdown' }), expect.objectContaining({ key: 'jsBlock' })],
      }),
    );
  });

  it.each([
    ['users', 'main', 'users'],
    ['main:users', 'main', 'users'],
    ['external:posts', 'external', 'posts'],
  ])(
    'normalizes v1 trigger resource collection "%s"',
    (collectionName, expectedDataSourceKey, expectedCollectionName) => {
      const model = createModel({
        triggers: {
          get: (type: string) =>
            type === 'approval'
              ? {
                  getCreateModelMenuItem: vi.fn(() => ({
                    key: 'originalApplicationContent',
                    label: 'Original application content',
                    useModel: 'NodeDetailsModel',
                    createModelOptions: {
                      use: 'NodeDetailsModel',
                      stepParams: {
                        resourceSettings: {
                          init: {
                            dataSourceKey: 'main',
                            collectionName,
                            dataPath: '$context.data',
                          },
                        },
                      },
                    },
                  })),
                }
              : undefined,
        },
      });

      const item = getOriginalApplicationContentItem(renderAddButton(model));

      expect(item.createModelOptions.stepParams.resourceSettings.init).toEqual(
        expect.objectContaining({
          dataSourceKey: expectedDataSourceKey,
          collectionName: expectedCollectionName,
          dataPath: '$context.data',
        }),
      );
    },
  );

  it('keeps v2 trigger resource collection options unchanged', () => {
    const model = createModel({
      getTriggerOptions: (type: string) =>
        type === 'approval'
          ? {
              getCreateModelMenuItem: vi.fn(() => ({
                key: 'originalApplicationContent',
                label: 'Original application content',
                useModel: 'NodeDetailsModel',
                createModelOptions: {
                  use: 'NodeDetailsModel',
                  stepParams: {
                    resourceSettings: {
                      init: {
                        dataSourceKey: 'external',
                        collectionName: 'posts',
                        dataPath: '$context.data',
                      },
                    },
                  },
                },
              })),
            }
          : undefined,
    });

    const item = getOriginalApplicationContentItem(renderAddButton(model));

    expect(item.createModelOptions.stepParams.resourceSettings.init).toEqual(
      expect.objectContaining({
        dataSourceKey: 'external',
        collectionName: 'posts',
        dataPath: '$context.data',
      }),
    );
  });
});
