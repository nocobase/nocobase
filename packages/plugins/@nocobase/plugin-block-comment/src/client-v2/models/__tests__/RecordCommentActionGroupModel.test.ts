/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionModel, ActionSceneEnum, RecordActionGroupModel } from '@nocobase/client-v2';
import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, describe, expect, test } from 'vitest';

import {
  RecordCommentActionGroupModel,
  RecordCommentActionModel,
  RecordCommentSubmitActionGroupModel,
} from '../actions/RecordCommentActionGroupModel';

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
    });

    const items = await RecordCommentSubmitActionGroupModel.defineChildren({
      engine,
      dataSourceManager: engine.dataSourceManager,
      model: { uid: 'comments-submit-actions' },
    } as any);

    expect(items.map((item) => item.useModel)).toEqual(['AIEmployeeActionModel', 'JSItemActionModel', 'JSActionModel']);
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
    } as any);

    expect(items.map((item) => item.useModel)).toContain('AIEmployeeActionModel');
  });
});
