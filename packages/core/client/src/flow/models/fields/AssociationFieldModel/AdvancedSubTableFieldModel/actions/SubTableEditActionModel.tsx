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
import React from 'react';
import { useRequest } from 'ahooks';
import { ActionModel } from '../../../../base/ActionModel';
import { SkeletonFallback } from '../../../../../components/SkeletonFallback';

function RemoteModelRenderer({ options, fieldModel }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      const model: any = await ctx.engine.loadOrCreateModel(options, { delegateToParent: false, delegate: ctx });
      model.context.defineProperty('associationModel', {
        value: fieldModel.context.associationModel,
      });
      model.scene = options.scene;
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

export function EditFormContent({ model, scene = 'edit' }) {
  const ctx = useFlowContext();
  const { Header, type } = ctx.view;
  model._closeView = ctx.view.close;
  const title = scene === 'new' ? ctx.t('Add new') : ctx.t('Detail');
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
              {title}
            </div>
          ) : (
            title
          )
        }
      />
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: `${scene}.edit-form-grid-block`,
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
          scene,
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

  onClick(event) {
    this.dispatchEvent('openView', {
      event,
      ...this.getInputArgs(),
    });
  }
  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('associationName', {
      get: () => {
        return this.context.collectionField.target;
      },
    });
    this.context.defineProperty('resource', {
      get: () => {
        return null;
      },
    });
  }
}

SubTableEditActionModel.define({
  label: tExpr('Edit'),
});

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
            record: ctx.record,
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
