/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, useFlowContext, useFlowViewContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Form, Select } from 'antd';
import React from 'react';
import { SkeletonFallback } from '../../components/SkeletonFallback';
import { FormFieldModel } from './FormFieldModel';

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

function RecordPickerContent() {
  const ctx = useFlowContext();
  const { Header, Footer } = ctx.view;
  return (
    <div>
      <Header title="选择记录" />
      <pre>{JSON.stringify(ctx.view, null, 2)}</pre>
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
        <Button type="primary">提交</Button>
      </Footer>
    </div>
  );
}

function RecordPickerField(props) {
  const ctx = useFlowContext();
  return (
    <Select
      open={false}
      onClick={() => {
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
              type: 'radio',
              renderCell: undefined,
              selectedRowKeys: undefined,
              defaultSelectedRowKeys: undefined,
              onChange: (selectedRowKeys) => {
                console.log('selectedRowKeys', selectedRowKeys);
              },
            },
          },
          content: (view) => {
            return <RecordPickerContent />;
          },
        });
      }}
    />
  );
}

export class RecordPickerFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];
  render() {
    return <RecordPickerField />;
  }
}
