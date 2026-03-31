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
} from '@nocobase/flow-engine';
import { useFlowModel } from '@nocobase/flow-engine';
import { Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import { observer } from '@formily/reactive-react';

export const CommentActions = observer(() => {
  const model = useFlowModel();
  const record = model.context.record;
  return (
    <DndProvider>
      <div style={{ textAlign: 'right' }}>
        <Space size={0} style={{ gap: 0 }}>
          {model.mapSubModels('actions', (action, index) => {
            const fork = action.createFork({}, `${record.id}_${index}`);
            fork.context.defineProperty('record', {
              get: () => record,
            });
            fork.context.defineMethod('setEditing', () => {
              model.context.setEditing();
            });
            return (
              <Droppable model={fork} key={fork.uid}>
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

          <AddSubModelButton
            key="comment-actions-add"
            model={model}
            subModelKey="actions"
            subModelBaseClasses={['CommentActionGroupModel']}
            afterSubModelInit={async (actionModel) => {
              // actionModel.setStepParams('buttonSettings', 'general', { type: 'default' });
            }}
          >
            <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Actions')}</FlowSettingsButton>
          </AddSubModelButton>
        </Space>
      </div>
    </DndProvider>
  );
});
