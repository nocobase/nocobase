/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { AddSubModelButton, FlowSettingsButton, DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { Table } from 'antd';
import React from 'react';
import { TableColumnModel } from '../../blocks/table/TableColumnModel';
import { DisplayAssociationFieldModel } from './DisplayAssociationFieldModel';

const AddFieldColumn = ({ model }) => {
  return (
    <AddSubModelButton
      model={model}
      subModelKey={'columns'}
      subModelBaseClasses={['TableColumnModel']}
      afterSubModelInit={async (column: any) => {
        await column.applyAutoFlows();
      }}
      afterSubModelAdd={async (column: any) => {
        const currentBlockModel = model.context.blockModel;
        currentBlockModel.addAppends(`${model.collectionField.name}.${column.fieldPath}`, true);
      }}
      keepDropdownOpen
    >
      <FlowSettingsButton icon={<SettingOutlined />}>{model.translate('Fields')}</FlowSettingsButton>
    </AddSubModelButton>
  );
};
export class DisplaySubTableFieldModel extends DisplayAssociationFieldModel {
  get collection() {
    return this.context.collectionField.targetCollection;
  }
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('resourceName', {
      get: () => this.context.collectionField.target,
      cache: false,
    });
  }
  public static readonly supportedFieldInterfaces = ['m2m', 'o2m', 'mbm'];

  getColumns() {
    const { enableIndexColumn = true } = this.props;
    const baseColumns = this.mapSubModels('columns', (column: any) => column.getColumnProps()).filter((v) => {
      return !v.hidden;
    });

    return [
      enableIndexColumn && {
        key: '__index__',
        width: 48,
        align: 'center',
        fixed: 'left',
        render: (props, record, index) => {
          return index + 1;
        },
      },
      ...baseColumns,
      {
        key: 'addColumn',
        fixed: 'right',
        width: 100,
        title: <AddFieldColumn model={this} />,
      },
    ].filter(Boolean) as any;
  }
  public render() {
    return (
      <Table
        tableLayout="fixed"
        size={this.props.size}
        rowKey={this.collection.filterTargetKey}
        virtual={this.props.virtual}
        scroll={{ x: 'max-content' }}
        dataSource={this.props.value}
        columns={this.getColumns()}
        pagination={false}
      />
    );
  }
}

DisplaySubTableFieldModel.registerFlow({
  key: 'TableAssociation',
  steps: {
    init: {
      async handler(ctx) {
        // await ctx.model.applySubModelsAutoFlows('columns');
      },
    },
  },
});

DisplaySubTableFieldModel.define({
  label: escapeT('Sub-table'),
});

DisplayItemModel.bindModelToInterface('DisplaySubTableFieldModel', ['m2m', 'o2m', 'mbm']);
