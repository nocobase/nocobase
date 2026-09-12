/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { DEFAULT_SUCCESS_MESSAGE, PUBLIC_FORM_PAGE_MODEL, PUBLIC_FORM_SUBMIT_ACTION_MODEL } from '../constants';
import { createPublicFormFlowModelTree, ensurePublicFormFlowModel } from '../modelTree';

describe('public form model tree', () => {
  it('creates a FlowModel tree for public form settings and runtime', () => {
    const tree = createPublicFormFlowModelTree(
      {
        key: 'form-1',
        title: 'Feedback',
        collection: 'main:posts',
      },
      (key) => key,
    );
    const page = tree.subModels.page;
    const formBlock = page.subModels.tabs[0].subModels.grid.subModels.items[0];
    const submitAction = formBlock.subModels.actions[0];

    expect(tree).toMatchObject({
      uid: 'form-1',
      use: 'RouteModel',
    });
    expect(page.use).toBe(PUBLIC_FORM_PAGE_MODEL);
    expect(page.props.showFlowSettings).toBe(false);
    expect(formBlock).toMatchObject({
      use: 'CreateFormModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'posts',
          },
        },
      },
    });
    expect(submitAction).toMatchObject({
      use: PUBLIC_FORM_SUBMIT_ACTION_MODEL,
      stepParams: {
        submitSettings: {
          saveResource: {
            requestConfig: {
              url: 'posts:publicSubmit',
            },
          },
        },
      },
    });
    expect(page.subModels.tabs[1].subModels.grid.subModels.items[0]).toMatchObject({
      use: 'MarkdownBlockModel',
      stepParams: {
        markdownBlockSettings: {
          editMarkdown: {
            content: DEFAULT_SUCCESS_MESSAGE,
          },
        },
      },
    });
  });

  it('keeps an existing persisted model when it already has sub models', async () => {
    const existing = {
      uid: 'form-1',
      subModels: {
        page: {
          uid: 'page-model-1',
          subModels: {},
        },
      },
    } as unknown as FlowModel;
    const flowEngine = {
      loadModel: vi.fn().mockResolvedValue(existing),
      getModel: vi.fn(),
      removeModelWithSubModels: vi.fn(),
      resolveModelTree: vi.fn(),
      createModelAsync: vi.fn(),
    };

    await expect(
      ensurePublicFormFlowModel(
        flowEngine as unknown as FlowEngine,
        {
          key: 'form-1',
          title: 'Feedback',
          collection: 'main:posts',
        },
        (key) => key,
      ),
    ).resolves.toBe(existing);
    expect(flowEngine.removeModelWithSubModels).not.toHaveBeenCalled();
    expect(flowEngine.createModelAsync).not.toHaveBeenCalled();
  });

  it('rebuilds a local empty route shell before creating the default model tree', async () => {
    const save = vi.fn();
    const created = {
      uid: 'form-1',
      save,
    };
    const flowEngine = {
      loadModel: vi.fn().mockResolvedValue(null),
      getModel: vi.fn().mockReturnValue({ uid: 'form-1' }),
      removeModelWithSubModels: vi.fn(),
      resolveModelTree: vi.fn(),
      createModelAsync: vi.fn().mockResolvedValue(created),
    };

    await expect(
      ensurePublicFormFlowModel(
        flowEngine as unknown as FlowEngine,
        {
          key: 'form-1',
          title: 'Feedback',
          collection: 'main:posts',
        },
        (key) => key,
      ),
    ).resolves.toBe(created);
    expect(flowEngine.removeModelWithSubModels).toHaveBeenCalledWith('form-1');
    expect(flowEngine.createModelAsync).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
