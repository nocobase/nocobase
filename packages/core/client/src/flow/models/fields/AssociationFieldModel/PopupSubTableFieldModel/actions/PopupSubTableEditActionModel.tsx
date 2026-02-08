/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, observable, useFlowContext, useFlowViewContext, FlowModelRenderer } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import React, { useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import { useRequest } from 'ahooks';
import { capitalize } from 'lodash';
import { Icon } from '../../../../../../icon/Icon';
import { ActionModel, ActionWithoutPermission } from '../../../../base/ActionModel';
import { SkeletonFallback } from '../../../../../components/SkeletonFallback';

function FieldWithoutPermissionPlaceholder({ targetModel, children }) {
  const t = targetModel.context.t;
  const fieldModel = targetModel;
  const collection = fieldModel.context.collectionField.collection;
  const dataSource = collection.dataSource;
  const name = fieldModel.context.collectionField.name;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  const { actionName } = fieldModel.forbidden || {};
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
      {
        name: nameValue,
        actionName: t(capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [nameValue, t]);
  return <Tooltip title={messageValue}>{children}</Tooltip>;
}

function RemoteModelRenderer({ options, fieldModel }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      const model: any = await ctx.engine.loadOrCreateModel(options, { delegateToParent: false, delegate: ctx });
      model.context.defineProperty('associationModel', {
        value: fieldModel.context.associationModel,
      });
      model.actionName = options.scene;
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

export function EditFormContent({ model, scene = 'update' }) {
  const ctx = useFlowContext();
  const { Header, type } = ctx.view;
  model._closeView = ctx.view.close;
  const title = scene === 'create' ? ctx.t('Add new') : ctx.t('Edit');
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

export class SubTableRecordAction extends ActionModel {
  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  renderHiddenInConfig(): React.ReactNode | undefined {
    const props = this.props;
    const icon = this.getIcon() ? <Icon type={this.getIcon() as any} /> : undefined;
    if (this.forbidden) {
      return (
        <FieldWithoutPermissionPlaceholder targetModel={this}>
          <Button {...props} icon={icon} style={{ opacity: '0.3' }}>
            {props.children || this.getTitle()}
          </Button>
        </FieldWithoutPermissionPlaceholder>
      );
    }
    return (
      <Tooltip title={this.context.t('The button is hidden and only visible when the UI Editor is active')}>
        <Button {...props} onClick={this.onClick.bind(this)} icon={icon} style={{ opacity: '0.3' }}>
          {props.children || this.getTitle()}
        </Button>
      </Tooltip>
    );
  }
}

SubTableRecordAction.registerFlow({
  key: 'buttonAclSettings',
  steps: {
    aclCheck: {
      use: 'aclCheck',
      async handler(ctx, params) {
        const result = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          actionName: ctx.actionName,
          fields: [ctx.collectionField.name],
        });
        if (!ctx.actionName) {
          return;
        }
        if (!result) {
          ctx.model.hidden = true;
          ctx.model.forbidden = {
            actionName: ctx.actionName,
          };
          ctx.exitAll();
        }
      },
    },
  },
});
export class PopupSubTableEditActionModel extends SubTableRecordAction {
  // 设置态隐藏时的占位渲染（与真实按钮外观一致，去除 onClick 并降低透明度）
  renderHiddenInConfig(): React.ReactNode | undefined {
    const props = this.props;
    const icon = this.getIcon() ? <Icon type={this.getIcon() as any} /> : undefined;
    if (this.forbidden) {
      return (
        <ActionWithoutPermission collection={this.context.collectionField.targetCollection}>
          <Button {...props} icon={icon} style={{ opacity: '0.3' }}>
            {props.children || this.getTitle()}
          </Button>
        </ActionWithoutPermission>
      );
    }
    return (
      <Tooltip title={this.context.t('The button is hidden and only visible when the UI Editor is active')}>
        <Button {...props} onClick={this.onClick.bind(this)} icon={icon} style={{ opacity: '0.3' }}>
          {props.children || this.getTitle()}
        </Button>
      </Tooltip>
    );
  }
  selectedRows = observable.ref([]);
  defaultPopupTitle = tExpr('Edit');
  defaultProps: ButtonProps = {
    type: 'link',
    title: tExpr('Edit'),
  };

  getAclActionName() {
    return 'update';
  }

  async onDispatchEventStart(eventName: string) {
    if (eventName === 'beforeRender') {
      this.onClick = (event) => {
        this.dispatchEvent('openView', {
          event,
          ...this.getInputArgs(),
        });
      };
    }
  }
}

PopupSubTableEditActionModel.registerFlow({
  key: 'buttonAclSettings',
  steps: {
    aclCheck: {
      async handler(ctx, params) {
        const result = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.target,
          actionName: ctx.actionName,
        });
        if (!ctx.actionName) {
          return;
        }
        if (!result && !ctx.record.__is_new__) {
          ctx.model.hidden = true;
          ctx.model.forbidden = {
            actionName: ctx.actionName,
          };
          ctx.exitAll();
        }
      },
    },
  },
});

PopupSubTableEditActionModel.define({
  label: tExpr('Edit'),
});

PopupSubTableEditActionModel.registerFlow({
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
        const associationModel = ctx?.associationModel;
        const parentItem =
          ctx?.item ??
          associationModel?.context?.item ??
          ({
            value:
              (typeof associationModel?.context?.getFormValues === 'function'
                ? associationModel.context.getFormValues()
                : associationModel?.context?.formValues) ?? associationModel?.context?.record,
          } as any);
        const parentItemOptions =
          ctx?.getPropertyOptions?.('item') ?? associationModel?.context?.getPropertyOptions?.('item');
        const itemLength = Array.isArray(associationModel?.props?.value)
          ? associationModel.props.value.length
          : undefined;
        const itemIndex = (() => {
          try {
            const list = associationModel?.props?.value;
            const rec = ctx?.record;
            if (!Array.isArray(list) || !rec) return undefined;

            const byRef = list.indexOf(rec);
            if (byRef >= 0) return byRef;

            if (rec.__index__ != null) {
              const byIndex = list.findIndex((r) => r?.__index__ === rec.__index__);
              if (byIndex >= 0) return byIndex;
            }

            const key = ctx?.collection?.filterTargetKey;
            if (Array.isArray(key)) {
              const hasAll = key.every((k) => rec?.[k] != null);
              if (!hasAll) return undefined;
              const byPk = list.findIndex((r) => key.every((k) => r?.[k] === rec?.[k]));
              return byPk >= 0 ? byPk : undefined;
            }
            if (key) {
              const pk = rec?.[key];
              if (pk == null) return undefined;
              const byPk = list.findIndex((r) => r?.[key] === pk);
              return byPk >= 0 ? byPk : undefined;
            }
            return undefined;
          } catch (e) {
            void e;
            return undefined;
          }
        })();
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'subForm',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            record: ctx.record,
            parentItem,
            parentItemMeta: parentItemOptions?.meta,
            parentItemResolver: parentItemOptions?.resolveOnServer,
            itemIndex,
            itemLength,
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
