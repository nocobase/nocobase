/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel, FlowModelRenderer, tExpr, useFlowViewContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import React from 'react';
import { SkeletonFallback } from '../../components/SkeletonFallback';
import { ActionModel, ActionSceneEnum } from '../base';
import {
  applyAssociateAction,
  getAssociationSelectorContextInputArgs,
  getAssociationTargetResourceSettings,
  isAssociationBlockContext,
} from './AssociationActionUtils';

function AssociateSelectorGridRenderer({ options }: { options: any }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      return await ctx.engine.loadOrCreateModel(options, {
        delegateToParent: false,
        delegate: ctx,
        skipSave: !ctx.flowSettingsEnabled,
      });
    },
    {
      refreshDeps: [ctx, options],
    },
  );

  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data as FlowModel} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

function AssociateSelectorContent({ model }: { model: AssociateActionModel }) {
  const ctx = useFlowViewContext();
  const { Header, Footer, type } = ctx.view;
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
              {ctx.t('Select record')}
            </div>
          ) : (
            ctx.t('Select record')
          )
        }
      />
      <AssociateSelectorGridRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: 'associate-selector-grid',
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
      />
      <Footer>
        {type === 'dialog' ? (
          <div style={{ padding: `0 ${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px` }}>
            <Button
              type="primary"
              onClick={async () => {
                await model.associateSelectedRows();
                ctx.view.close();
              }}
            >
              {ctx.t('Submit')}
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            onClick={async () => {
              await model.associateSelectedRows();
              ctx.view.close();
            }}
          >
            {ctx.t('Submit')}
          </Button>
        )}
      </Footer>
    </div>
  );
}

export class AssociateActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;
  static capabilityActionName = 'update';

  defaultPopupTitle = tExpr('Select record');
  selectedRows: any[] = [];

  defaultProps: ButtonProps = {
    title: tExpr('Associate'),
    icon: 'LinkOutlined',
  };

  getAclActionName() {
    return 'update';
  }

  async associateSelectedRows() {
    await applyAssociateAction(this.context, this.selectedRows);
    this.selectedRows = [];
  }
}

AssociateActionModel.define({
  label: tExpr('Associate'),
  sort: 15,
  hide(ctx) {
    return !isAssociationBlockContext(ctx);
  },
});

AssociateActionModel.registerFlow({
  key: 'associateSettings',
  title: tExpr('Associate settings'),
  on: 'click',
  steps: {
    openSelector: {
      async handler(ctx, params) {
        const targetResourceSettings = getAssociationTargetResourceSettings(ctx);
        const openMode = ctx.inputArgs?.isMobileLayout ? 'embed' : ctx.inputArgs?.mode || params?.mode || 'drawer';
        const size = ctx.inputArgs?.size || params?.size || 'medium';
        const sizeToWidthMap: Record<string, Record<string, string | undefined>> = {
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

        ctx.model.selectedRows = [];
        await ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'select',
            dataSourceKey: targetResourceSettings.dataSourceKey,
            collectionName: targetResourceSettings.collectionName,
            ...getAssociationSelectorContextInputArgs(ctx),
            rowSelectionProps: {
              type: 'checkbox',
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                ctx.model.selectedRows = selectedRows || [];
              },
            },
          },
          content: () => <AssociateSelectorContent model={ctx.model as AssociateActionModel} />,
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
