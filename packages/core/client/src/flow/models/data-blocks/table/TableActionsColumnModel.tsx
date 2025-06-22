/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { observer } from '@formily/reactive-react';
import { AddActionButton, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { Skeleton, Space } from 'antd';
import React from 'react';
import { ActionModel } from '../../base/ActionModel';
import { SupportedFieldInterfaces } from '../../base/FieldModel';
import { TableColumnModel } from './TableColumnModel';

const Columns = observer<any>(({ record, model, index }) => {
  return (
    <Space size={'middle'}>
      {model.mapSubModels('actions', (action: ActionModel) => {
        const fork = action.createFork({}, `${index}`);
        return (
          <FlowModelRenderer
            showFlowSettings={{ showBorder: false }}
            key={fork.uid}
            model={fork}
            fallback={<Skeleton.Button size="small" />}
            extraContext={{ currentRecord: record }}
          />
        );
      })}
    </Space>
  );
});

export class TableActionsColumnModel extends TableColumnModel {
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
        >
          <Space>
            {this.props.title || 'Actions'}
            <AddActionButton model={this} subModelBaseClass="RecordActionModel" subModelKey="actions">
              <SettingOutlined />
            </AddActionButton>
          </Space>
        </FlowsFloatContextMenu>
      ),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => <Columns record={record} model={this} index={index} />;
  }
}
