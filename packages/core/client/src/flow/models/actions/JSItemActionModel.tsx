/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, createSafeDocument, createSafeNavigator, createSafeWindow, tExpr } from '@nocobase/flow-engine';
import React from 'react';
import { CodeEditor } from '../../components/code-editor';
import { ActionModel, ActionSceneEnum, CollectionActionGroupModel, RecordActionGroupModel } from '../base';
import { FormActionGroupModel } from '../blocks/form/FormActionGroupModel';
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
      void this.applyFlow('jsSettings');
    }
    this._mountedOnce = true;
  }

  protected onUnmount(): void {
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
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: {
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams() {
        return {
          version: 'v2',
          code: defaultJSActionItemCode.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
            { version },
          );
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
