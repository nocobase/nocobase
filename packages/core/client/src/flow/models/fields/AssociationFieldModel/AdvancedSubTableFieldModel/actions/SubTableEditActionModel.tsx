/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  tExpr,
  observable,
  useFlowContext,
  FlowModel,
  useFlowViewContext,
  FlowModelRenderer,
} from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import React, { useEffect } from 'react';
import { useRequest } from 'ahooks';
import { ActionModel } from '../../../../base/ActionModel';
import { SkeletonFallback } from '../../../../../components/SkeletonFallback';

function RemoteModelRenderer({ options, fieldModel }) {
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
  useEffect(() => {
    if (!data) {
      return;
    }
    if (fieldModel) {
      fieldModel.selectBlockModel = data;
    }
  }, [data]);
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

export function EditFormContent({ model }) {
  const ctx = useFlowContext();
  const { Header, type } = ctx.view;
  model._closeView = ctx.view.close;
  return (
    <div>
      <Header
        title={
          type === 'dialog' ? (
            <div
              style={{
                padding: `${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px 0`,
                marginBottom: -ctx.themeToken.marginSM,
                backgroundColor: 'var(--colorBgLayout)',
              }}
            >
              {ctx.t('Detail')}
            </div>
          ) : (
            ctx.t('Detail')
          )
        }
      />
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: 'grid-block',
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
        fieldModel={model}
      />
    </div>
  );
}

export class SubTableEditActionModel extends ActionModel {
  selectedRows = observable.ref([]);
  defaultPopupTitle = tExpr('Edit');
  defaultProps: ButtonProps = {
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }

  // protected onMount(): void {
  //   this.onClick = (e) => {
  //     this.dispatchEvent('openView', {
  //       event: e,
  //     });
  //   };
  // }

  onClick(event) {
    this.dispatchEvent('openView', {
      event,
      ...this.getInputArgs(),
    });
  }

  change() {
    console.log(this.selectedRows.value);
    // this.props.onChange(this.selectedRows.value);
  }
}

SubTableEditActionModel.define({
  label: tExpr('Edit'),
});

// SubTableEditActionModel.registerFlow({
//   key: 'subTableEditSettings',
//   on: 'click',
//   steps: {
//     edit: {
//       async handler(ctx, params) {
//         console.log(ctx.record, params);
//       },
//     },
//   },
// });

SubTableEditActionModel.registerFlow({
  key: 'popupSettings',
  title: tExpr('Edit setting'),
  on: {
    eventName: 'openView',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit popup'),
      uiSchema: {
        mode: {
          type: 'string',
          title: tExpr('Open mode'),
          enum: [
            { label: tExpr('Drawer'), value: 'drawer' },
            { label: tExpr('Dialog'), value: 'dialog' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        size: {
          type: 'string',
          title: tExpr('Popup size'),
          enum: [
            { label: tExpr('Small'), value: 'small' },
            { label: tExpr('Medium'), value: 'medium' },
            { label: tExpr('Large'), value: 'large' },
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
        console.log(ctx.record);
        const { onChange } = ctx.inputArgs;
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
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'editInFront',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
          },
          content: () => <EditFormContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
        });
      },
    },
  },
});
