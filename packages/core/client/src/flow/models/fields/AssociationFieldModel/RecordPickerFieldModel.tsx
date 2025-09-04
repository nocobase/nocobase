/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowModel,
  FlowModelRenderer,
  observable,
  useFlowContext,
  useFlowViewContext,
  escapeT,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Select } from 'antd';
import React from 'react';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { FormFieldModel } from '../FormFieldModel';
import { LabelByField } from './RemoteSelectFieldModel';

function RemoteModelRenderer({ options }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options, { delegateToParent: false, delegate: ctx });
      return model;
    },
    {
      refreshDeps: [ctx, options],
    },
  );
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

function RecordPickerContent({ model }) {
  const ctx = useFlowContext();
  const { Header, Footer } = ctx.view;
  return (
    <div>
      <Header title={ctx.t('Select record')} />
      {/* <pre>{JSON.stringify(ctx.view, null, 2)}</pre> */}
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: 'grid',
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
      <Footer>
        <Button
          type="primary"
          onClick={() => {
            model.change();
            ctx.view.close();
          }}
        >
          {ctx.t('Submit')}
        </Button>
      </Footer>
    </div>
  );
}

function RecordPickerField(props) {
  const { fieldNames } = props;
  const ctx = useFlowContext();
  const toOne = ['belongsTo', 'hasOne'].includes(ctx.collectionField.type);
  const normalizeValue = (value, fieldNames, toOne) => {
    if (!value) return toOne ? undefined : [];
    if (toOne) {
      return {
        ...value,
        label: value[fieldNames.label],
        value: value[fieldNames.value],
      };
    }
    return value.map((v) => ({
      ...v,
      label: v[fieldNames.label],
      value: v[fieldNames.value],
    }));
  };
  const handleOpenDrawer = () => {
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      inheritContext: false,
      inputArgs: {
        parentId: ctx.model.uid,
        scene: 'select',
        dataSourceKey: ctx.collection.dataSourceKey,
        collectionName: ctx.collectionField?.target,
        rowSelectionProps: {
          type: toOne ? 'radio' : 'checkbox',
          defaultSelectedRows: ctx.model.props.value,
          renderCell: undefined,
          selectedRowKeys: undefined,
          onChange: (_, selectedRows) => {
            ctx.model.selectedRows.value = toOne ? selectedRows?.[0] : selectedRows;
          },
        },
      },
      content: () => <RecordPickerContent model={ctx.model} />,
    });
  };
  return (
    <Select
      open={false}
      value={normalizeValue(props.value, fieldNames, toOne)}
      labelRender={(item) => {
        return <LabelByField option={item} fieldNames={fieldNames} />;
      }}
      labelInValue
      mode={toOne ? undefined : 'multiple'}
      fieldNames={fieldNames}
      onClick={handleOpenDrawer}
      options={props.value}
      allowClear
      onChange={(newValue, option) => {
        ctx.model.selectedRows.value = option;
        ctx.model.change();
      }}
    />
  );
}

export class RecordPickerFieldModel extends FormFieldModel {
  selectedRows = observable.ref([]);

  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];

  render() {
    return <RecordPickerField {...this.props} />;
  }

  change() {
    this.props.onChange(this.selectedRows.value);
  }
}

//专有配置项
RecordPickerFieldModel.registerFlow({
  key: 'recordPickerSettings',
  title: escapeT('Association recordPicker settings'),
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
    },
  },
});
