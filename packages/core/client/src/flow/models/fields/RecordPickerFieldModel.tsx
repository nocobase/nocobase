/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, observable, useFlowContext, useFlowViewContext } from '@nocobase/flow-engine';
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

function RecordPickerContent({ model }) {
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
        <Button
          type="primary"
          onClick={() => {
            model.change();
            ctx.view.close();
          }}
        >
          提交
        </Button>
      </Footer>
    </div>
  );
}

function RecordPickerField(props) {
  const ctx = useFlowContext();
  console.log('ctx.model.props.value', ctx.model.props.value?.slice?.());
  return (
    <Select
      open={false}
      value={ctx.model.props.value?.slice?.()}
      labelRender={(item) => {
        console.log('labelRender item', item);
        return 'aa';
      }} // use labelInValue to avoid warning
      labelInValue
      mode="multiple"
      fieldNames={{ label: 'name', value: 'name' }}
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
              defaultSelectedRows: ctx.model.props.value,
              onChange: (_, selectedRows) => {
                ctx.model.selectedRows.value = selectedRows;
              },
            },
          },
          content: (view) => {
            return <RecordPickerContent model={ctx.model} />;
          },
        });
      }}
    />
  );
}

export class RecordPickerFieldModel extends FormFieldModel {
  selectedRows = observable.ref([]);

  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'];

  render() {
    console.log('RecordPickerFieldModel render', this.props);
    return <RecordPickerField />;
  }

  change() {
    this.props.onChange(this.selectedRows.value);
  }
}
