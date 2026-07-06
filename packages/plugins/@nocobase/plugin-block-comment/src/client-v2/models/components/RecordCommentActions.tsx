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

export const RecordCommentActions = observer(
  ({
    blockModel,
    record,
    itemModel,
    forkKeyPrefix,
    setEditing,
  }: {
    blockModel: RecordCommentsBlockModel;
    record: RecordCommentRecord;
    itemModel: FlowModel;
    forkKeyPrefix: string;
    setEditing: () => void;
  }) => {
    const recordKey = getRecordPrimaryKeyValue(record, blockModel.collection);

    return (
      <DndProvider>
        <Space size={4} className={recordCommentActionsClassName}>
          {itemModel.mapSubModels('actions', (action, index) => {
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
              model={itemModel}
              subModelKey="actions"
              subModelBaseClasses={['RecordCommentActionGroupModel']}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>{itemModel.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          ) : null}
        </Space>
      </DndProvider>
    );
  },
);
