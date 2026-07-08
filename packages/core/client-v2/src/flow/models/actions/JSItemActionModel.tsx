/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, type StepDefinition } from '@nocobase/flow-engine';
import React from 'react';
import { ActionModel, ActionSceneEnum, CollectionActionGroupModel, RecordActionGroupModel } from '../base';
import { FormActionGroupModel } from '../blocks/form/FormActionGroupModel';
import {
  createJSItemRunJsUISchema,
  createJSItemSourceBindingStep,
  createJSItemSourceModeStep,
  getJSItemRunJsEditorTitle,
  getJSItemRuntimeFlowSettingSteps,
  INLINE_SOURCE_MODE,
  resetJSItemRuntimeElement,
  runJSItemRuntime,
} from '../fields/jsItemLightExtensionRuntime';
import { PopupSubTableFormActionGroupModel } from '../fields/AssociationFieldModel/PopupSubTableFieldModel/actions/PopupSubTableFormSubmitActionModel';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';

const defaultJSActionItemCode = `
const { Button } = ctx.antd;

function JsItem() {
  return (
    <Button
      onClick={() => ctx.message.success('Click from JS item')}
    >
      JS item
    </Button>
  );
}

ctx.render(<JsItem />);
`;

export class JSItemActionModel extends ActionModel {
  private _offResourceRefresh?: () => void;
  private _mountedOnce = false;
  static scene = ActionSceneEnum.all;

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    return getJSItemRuntimeFlowSettingSteps(this);
  }

  render() {
    return <div ref={this.context.ref} style={{ display: 'inline-flex', minHeight: 22, alignItems: 'center' }} />;
  }

  renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <div
        ref={this.context.ref}
        style={{ display: 'inline-flex', minHeight: 22, alignItems: 'center', opacity: 0.3 }}
      />
    );
  }

  protected onMount() {
    const resource = this.context.resource;
    if (resource) {
      const handler = () => {
        this.applyFlow('jsSettings');
      };
      resource.on('refresh', handler);
      this._offResourceRefresh = () => {
        resource.off('refresh', handler);
      };
    }

    if (this._mountedOnce && this.context.ref?.current) {
      this.applyFlow('jsSettings');
    }
    this._mountedOnce = true;
  }

  protected onUnmount(): void {
    if (this.context.ref?.current) {
      resetJSItemRuntimeElement(this.context.ref.current);
    }
    this._offResourceRefresh?.();
    this._offResourceRefresh = undefined;
  }
}

JSItemActionModel.define({
  label: tExpr('JS item'),
  sort: 9998,
  createModelOptions: {
    use: 'JSItemActionModel',
  },
});

JSItemActionModel.registerFlow({
  key: 'buttonSettings',
  title: tExpr('Button settings'),
  sort: -999,
  steps: {
    linkageRules: {
      use: 'actionLinkageRules',
    },
  },
});

JSItemActionModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
  steps: {
    sourceMode: createJSItemSourceModeStep(),
    sourceBinding: createJSItemSourceBindingStep(),
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createJSItemRunJsUISchema({ scene: 'block' }),
      uiMode: async (ctx) => ({
        type: 'embed',
        props: {
          title: await getJSItemRunJsEditorTitle(ctx),
          footer: null,
          maxWidth: '960px',
          minWidth: '720px',
          width: '45%',
          styles: {
            body: {
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              transform: 'translateX(0)',
            },
          },
        },
      }),
      defaultParams() {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: defaultJSActionItemCode.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          await runJSItemRuntime({
            ctx,
            params: params || {},
            runJs: {
              code,
              version,
            },
            element,
          });
        });
      },
    },
  },
});

CollectionActionGroupModel.registerActionModels({
  JSItemActionModel,
});

RecordActionGroupModel.registerActionModels({
  JSItemActionModel,
});

FormActionGroupModel.registerActionModels({
  JSItemActionModel,
});

PopupSubTableFormActionGroupModel.registerActionModels({
  JSItemActionModel,
});
