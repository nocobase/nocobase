/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { observer } from '@formily/reactive-react';
import { AddActionButton, FlowModel, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { Skeleton, Space } from 'antd';
import React from 'react';
import { ActionModel } from '../../base/ActionModel';
import { SupportedFieldInterfaces } from '../../base/FieldModel';

const Columns = observer<any>(({ record, model, index }) => {
  return (
    <Space size={'middle'}>
      {model.mapSubModels('actions', (action: ActionModel) => {
        const fork = action.createFork({}, `${index}`);
        fork.setSharedContext({ index, currentRecord: record });
        return (
          <FlowModelRenderer
            showFlowSettings={{ showBorder: false }}
            key={fork.uid}
            model={fork}
            fallback={<Skeleton.Button size="small" />}
            sharedContext={{ currentRecord: record }}
          />
        );
      })}
    </Space>
  );
});

const AddActionToolbarComponent = ({ model }) => {
  return (
    <AddActionButton model={model} subModelBaseClass="RecordActionModel" subModelKey="actions">
      <PlusOutlined />
    </AddActionButton>
  );
};

export class TableActionsColumnModel extends FlowModel {
  static readonly supportedFieldInterfaces: SupportedFieldInterfaces = null;

  getColumnProps() {
    return {
      // title: 'Actions',
      ...this.props,
      width: 100,
      title: (
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
          showBorder={false}
          extraToolbarItems={[
            {
              key: 'add-record-action',
              component: AddActionToolbarComponent,
            },
          ]}
        >
          <Space>{this.props.title || 'Actions'}</Space>
        </FlowsFloatContextMenu>
      ),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => <Columns record={record} model={this} index={index} />;
  }
}
