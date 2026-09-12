/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowSettingsButton,
  observer,
  type FlowModel,
} from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { Space } from 'antd';
import React from 'react';

import type { RecordCommentsBlockModel } from '../RecordCommentsBlockModel';
import type { RecordCommentRecord } from '../utils';
import { getRecordPrimaryKeyValue } from '../utils';

const normalizeForkKeyPart = (value: unknown) => {
  const result = String(value ?? '').replace(/[^a-zA-Z0-9_-]+/g, '_');
  return result || 'fork';
};

type FlowModelWithForkId = FlowModel & {
  forkId?: string | number;
};

const getFlowModelRenderKey = (model: FlowModel, fallback: string) => {
  const forkId = (model as FlowModelWithForkId).forkId;
  return `${model.uid}:${forkId ?? fallback}`;
};

const recordCommentActionsClassName = css`
  .ant-btn-link {
    height: auto;
    padding: 0;
  }
`;

const UNIQUE_RECORD_COMMENT_ACTION_MODELS = new Set([
  'QuoteReplyRecordCommentActionModel',
  'EditRecordCommentActionModel',
  'DeleteRecordCommentActionModel',
]);

export const RecordCommentActions = observer(
  ({
    blockModel,
    record,
    itemModel,
    actionSettingsModel = itemModel,
    forkKeyPrefix,
    setEditing,
  }: {
    blockModel: RecordCommentsBlockModel;
    record: RecordCommentRecord;
    itemModel: FlowModel;
    actionSettingsModel?: FlowModel;
    forkKeyPrefix: string;
    setEditing: () => void;
  }) => {
    const recordKey = getRecordPrimaryKeyValue(record, blockModel.collection);
    const renderedUniqueActionModels = new Set<string>();

    return (
      <DndProvider>
        <Space size={4} className={recordCommentActionsClassName}>
          {itemModel.mapSubModels('actions', (action, index) => {
            const actionModelName = action.constructor.name;
            if (UNIQUE_RECORD_COMMENT_ACTION_MODELS.has(actionModelName)) {
              if (renderedUniqueActionModels.has(actionModelName)) {
                return null;
              }
              renderedUniqueActionModels.add(actionModelName);
            }

            const forkKey = [forkKeyPrefix, recordKey || 'record', action.uid, index]
              .map(normalizeForkKeyPart)
              .join('_');
            const fork = action.createFork({}, forkKey);
            fork.context.defineProperty('record', {
              get: () => record,
            });
            fork.context.defineProperty('resource', {
              get: () => blockModel.resource,
            });
            fork.context.defineProperty('collection', {
              get: () => blockModel.collection,
            });
            fork.context.defineProperty('blockModel', {
              get: () => blockModel,
            });
            fork.context.defineMethod('setEditing', setEditing);
            return (
              <Droppable model={fork} key={getFlowModelRenderKey(fork, forkKey)}>
                <FlowModelRenderer
                  model={fork}
                  showFlowSettings={{ showBackground: false, showBorder: false }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            );
          })}

          {itemModel.context.flowSettingsEnabled ? (
            <AddSubModelButton
              key="record-comment-actions-add"
              model={actionSettingsModel}
              subModelKey="actions"
              subModelBaseClasses={['RecordCommentActionGroupModel']}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>
                {actionSettingsModel.translate('Actions')}
              </FlowSettingsButton>
            </AddSubModelButton>
          ) : null}
        </Space>
      </DndProvider>
    );
  },
);
