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
import React, { useEffect } from 'react';
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
  useEffect(() => {
    ctx.model.selectedRows.value = props.value;
  }, [props.value]);
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

  return (
    <Select
      {...props}
      open={false}
      value={normalizeValue(props.value, fieldNames, toOne)}
      labelRender={(item) => {
        return <LabelByField option={item} fieldNames={fieldNames} />;
      }}
      labelInValue
      mode={toOne ? undefined : 'multiple'}
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
  onInit(option) {
    super.onInit(option);
    this.onClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
      });
    };
  }
  set onClick(fn) {
    this.setProps({ onClick: fn });
  }

  change() {
    this.props.onChange(this.selectedRows.value);
  }
}

RecordPickerFieldModel.registerFlow({
  key: 'popupSettings',
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: escapeT('Edit popup'),
      uiSchema: {
        mode: {
          type: 'string',
          title: escapeT('Open mode'),
          enum: [
            { label: escapeT('Drawer'), value: 'drawer' },
            { label: escapeT('Dialog'), value: 'dialog' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        size: {
          type: 'string',
          title: escapeT('Popup size'),
          enum: [
            { label: escapeT('Small'), value: 'small' },
            { label: escapeT('Medium'), value: 'medium' },
            { label: escapeT('Large'), value: 'large' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const toOne = ['belongsTo', 'hasOne'].includes(ctx.collectionField.type);
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'select',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            rowSelectionProps: {
              type: toOne ? 'radio' : 'checkbox',
              defaultSelectedRows: () => {
                return ctx.model.props.value;
              },
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                if (toOne) {
                  // 单选
                  ctx.model.selectedRows.value = selectedRows?.[0];
                } else {
                  // 多选：追加
                  const prev = ctx.model.selectedRows.value || [];
                  const merged = [...prev, ...selectedRows];

                  // 去重，防止同一个值重复
                  const unique = merged.filter(
                    (row, index, self) =>
                      index ===
                      self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
                  );

                  ctx.model.selectedRows.value = unique;
                }
              },
            },
          },
          content: () => <RecordPickerContent model={ctx.model} />,
        });
      },
    },
  },
});
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
