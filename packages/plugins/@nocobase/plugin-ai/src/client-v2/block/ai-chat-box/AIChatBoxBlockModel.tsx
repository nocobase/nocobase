/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BlockModel } from '@nocobase/client-v2';
import { EMPTY_COLUMN_UID, type FlowModel, type GridLayoutV2 } from '@nocobase/flow-engine';
import {
  ChatBoxRuntimeProvider,
  createChatBoxRuntime,
  type ChatBoxRuntime,
} from '../../ai-employees/chatbox/stores/runtime';
import { tExpr } from '../../locale';
import { AIChatBoxView } from './components/AIChatBoxView';
import { registerAIChatBoxBlockSettings } from './settings';
import { DEFAULT_AI_CHAT_BOX_GRID_WIDTH, DEFAULT_AI_CHAT_BOX_WIDTH, getDefaultAIChatBoxSettings } from './utils';
import type { AIChatBoxBlockProps, AIChatBoxBlockStructure } from './types';

const getOrCreateBlockRuntime = (model: AIChatBoxBlockModel) => {
  model.chatBoxRuntime ??= createChatBoxRuntime({ mode: 'block' });
  return model.chatBoxRuntime;
};

type GridLikeModel = FlowModel & {
  getGridLayout?: () => GridLayoutV2;
  saveGridLayout?: (layout: GridLayoutV2) => void | Promise<void>;
};

const GRID_COLUMN_COUNT = 24;

const resizeNewChatBoxGridItem = async (model: AIChatBoxBlockModel) => {
  const parent = model.parent as GridLikeModel | undefined;
  if (!parent?.getGridLayout || !parent.saveGridLayout || model.subKey !== 'items') {
    return;
  }

  const layout = parent.getGridLayout();
  const targetRow = layout.rows.find((row) => {
    const targetCell = row.cells[0];
    return (
      row.cells.length === 1 &&
      row.sizes?.[0] === GRID_COLUMN_COUNT &&
      Array.isArray(targetCell?.items) &&
      targetCell.items.length === 1 &&
      targetCell.items[0] === model.uid
    );
  });
  if (!targetRow) {
    return;
  }

  const emptyWidth = GRID_COLUMN_COUNT - DEFAULT_AI_CHAT_BOX_GRID_WIDTH;
  const nextLayout: GridLayoutV2 = {
    ...layout,
    rows: layout.rows.map((row) => {
      if (row.id !== targetRow.id) {
        return row;
      }
      return {
        ...row,
        cells: [
          row.cells[0],
          {
            id: `${row.id}:cell:empty`,
            items: [EMPTY_COLUMN_UID],
          },
        ],
        sizes: [DEFAULT_AI_CHAT_BOX_GRID_WIDTH, emptyWidth],
      };
    }),
  };

  await parent.saveGridLayout(nextLayout);
};

export class AIChatBoxBlockModel extends BlockModel<AIChatBoxBlockStructure> {
  declare props: AIChatBoxBlockProps;
  chatBoxRuntime?: ChatBoxRuntime;

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await resizeNewChatBoxGridItem(this);
  }

  renderComponent() {
    return (
      <ChatBoxRuntimeProvider runtime={getOrCreateBlockRuntime(this)}>
        <AIChatBoxView model={this} />
      </ChatBoxRuntimeProvider>
    );
  }
}

AIChatBoxBlockModel.define({
  label: tExpr('AI chat box'),
  sort: 359,
  createModelOptions: {
    use: 'AIChatBoxBlockModel',
    props: {
      minWidth: DEFAULT_AI_CHAT_BOX_WIDTH,
      ...getDefaultAIChatBoxSettings(),
    },
    subModels: {
      bodyBlocks: [
        {
          use: 'AIChatBoxCoreModel',
        },
      ],
      actions: [],
    },
  },
});

registerAIChatBoxBlockSettings(AIChatBoxBlockModel);
