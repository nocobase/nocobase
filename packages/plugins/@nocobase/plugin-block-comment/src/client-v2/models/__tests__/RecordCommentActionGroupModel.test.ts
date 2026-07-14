/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, RecordActionGroupModel } from '@nocobase/client-v2';
import { FlowEngine, type FlowModelContext } from '@nocobase/flow-engine';
import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  RecordCommentActionGroupModel,
  RecordCommentActionModel,
  RecordCommentSubmitActionGroupModel,
} from '../actions/RecordCommentActionGroupModel';
import { RecordCommentSubmitActionModel } from '../actions/RecordCommentSubmitActionModel';

type TestFlowStep = {
  defaultParams?: Record<string, unknown>;
  handler?: (ctx: unknown, params?: unknown) => unknown;
};

type TestFlow = {
  steps?: Record<string, TestFlowStep>;
};

type TestFlowModelClass = typeof RecordCommentSubmitActionModel & {
  globalFlowRegistry: {
    getFlow: (key: string) => TestFlow | undefined;
  };
};

const getRecordCommentSubmitFlow = (key: string) =>
  (RecordCommentSubmitActionModel as unknown as TestFlowModelClass).globalFlowRegistry.getFlow(key);

describe('RecordCommentSubmitActionGroupModel', () => {
  const originalAIEmployeeActionModel = RecordActionGroupModel.currentModels.get('AIEmployeeActionModel');

  afterEach(() => {
    if (originalAIEmployeeActionModel) {
      RecordActionGroupModel.currentModels.set('AIEmployeeActionModel', originalAIEmployeeActionModel);
    } else {
      RecordActionGroupModel.currentModels.delete('AIEmployeeActionModel');
    }
  });

  test('offers AI employee, JS item, and JS action buttons for comment submit actions', async () => {
    class AIEmployeeActionModel extends ActionModel {
      static scene = ActionSceneEnum.all;
    }

    AIEmployeeActionModel.define({
      label: 'AI employees',
      sort: 8000,
    });

    RecordActionGroupModel.registerActionModels({
      AIEmployeeActionModel,
    });

    const engine = new FlowEngine();
    engine.registerModels({
      RecordCommentSubmitActionGroupModel,
      RecordCommentSubmitActionModel,
    });

    const items = await RecordCommentSubmitActionGroupModel.defineChildren({
      engine,
      dataSourceManager: engine.dataSourceManager,
      model: { uid: 'comments-submit-actions' },
    } as unknown as FlowModelContext);

    expect(items.map((item) => item.useModel)).toEqual([
      'RecordCommentSubmitActionModel',
      'AIEmployeeActionModel',
      'JSItemActionModel',
      'JSActionModel',
    ]);
  });
});

describe('RecordCommentSubmitActionModel', () => {
  test('stays on the current page without a default popup message after successful submission', () => {
    const flow = getRecordCommentSubmitFlow('submitSettings');

    expect(flow?.steps?.afterSuccess?.defaultParams?.successMessage).toBe('');
    expect(flow?.steps?.afterSuccess?.defaultParams?.actionAfterSuccess).toBe('stay');
  });

  test('passes assigned field values to the comment submit handler', async () => {
    const flow = getRecordCommentSubmitFlow('submitSettings');
    const saveResource = flow?.steps?.saveResource;
    const submitComment = vi.fn(async (params) => params);
    const model = {
      setProps: vi.fn(),
    };

    if (!saveResource?.handler) {
      throw new Error('saveResource handler is not registered');
    }

    const result = await saveResource.handler(
      {
        model,
        submitComment,
        t: (message: string) => message,
      },
      {
        assignedValues: {
          status: 'published',
        },
        requestConfig: {
          params: {
            triggerWorkflows: 'comment-workflow',
          },
        },
      },
    );

    expect(submitComment).toHaveBeenCalledWith({
      assignedValues: {
        status: 'published',
      },
      requestConfig: {
        params: {
          triggerWorkflows: 'comment-workflow',
        },
      },
    });
    expect(result).toEqual({
      assignedValues: {
        status: 'published',
      },
      requestConfig: {
        params: {
          triggerWorkflows: 'comment-workflow',
        },
      },
    });
    expect(model.setProps).toHaveBeenNthCalledWith(1, 'loading', true);
    expect(model.setProps).toHaveBeenNthCalledWith(2, 'loading', false);
  });

  test('does not submit when the comment content is empty', async () => {
    const flow = getRecordCommentSubmitFlow('submitSettings');
    const validateCommentContent = flow?.steps?.validateCommentContent;
    const saveResource = flow?.steps?.saveResource;
    const exit = vi.fn();
    const submitComment = vi.fn();
    const model = {
      setProps: vi.fn(),
    };

    validateCommentContent?.handler?.({
      commentCanSubmit: false,
      exit,
    });

    if (!saveResource?.handler) {
      throw new Error('saveResource handler is not registered');
    }

    await saveResource.handler({
      commentCanSubmit: false,
      exit,
      model,
      submitComment,
      t: (message: string) => message,
    });

    expect(exit).toHaveBeenCalledTimes(2);
    expect(submitComment).not.toHaveBeenCalled();
    expect(model.setProps).not.toHaveBeenCalled();
  });

  test('binds workflow settings without workflow plugin model registration changes', () => {
    const flow = getRecordCommentSubmitFlow('recordCommentTriggerWorkflowsActionSettings');
    const model = {
      setSaveRequestConfig: vi.fn(),
    };

    flow?.steps?.setTriggerWorkflows?.handler?.(
      { model },
      {
        group: [{ workflowKey: 'comment-workflow' }, { workflowKey: undefined }],
      },
    );

    expect(flow).toBeTruthy();
    expect(flow?.steps?.setTriggerWorkflows).toBeTruthy();
    expect(model.setSaveRequestConfig).toHaveBeenCalledWith({
      params: {
        triggerWorkflows: 'comment-workflow',
      },
    });
  });
});

describe('RecordCommentActionGroupModel', () => {
  const originalAIEmployeeActionModel = RecordActionGroupModel.currentModels.get('AIEmployeeActionModel');

  afterEach(() => {
    if (originalAIEmployeeActionModel) {
      RecordActionGroupModel.currentModels.set('AIEmployeeActionModel', originalAIEmployeeActionModel);
    } else {
      RecordActionGroupModel.currentModels.delete('AIEmployeeActionModel');
    }
  });

  test('offers AI employee buttons for comment record actions', async () => {
    class AIEmployeeActionModel extends ActionModel {
      static scene = ActionSceneEnum.all;
    }

    AIEmployeeActionModel.define({
      label: 'AI employees',
      sort: 8000,
    });

    RecordActionGroupModel.registerActionModels({
      AIEmployeeActionModel,
    });

    const engine = new FlowEngine();
    engine.registerModels({
      RecordCommentActionGroupModel,
      RecordCommentActionModel,
    });

    const items = await RecordCommentActionGroupModel.defineChildren({
      engine,
      dataSourceManager: engine.dataSourceManager,
      model: { uid: 'comment-record-actions' },
    } as unknown as FlowModelContext);

    expect(items.map((item) => item.useModel)).toContain('AIEmployeeActionModel');
  });
});
