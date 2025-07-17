/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, FlowModel, reactive } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';

export class ReadPrettyFieldModel extends FieldModel {
  static readonly supportedFieldInterfaces = '*' as any;

  getValue() {
    return this.context.fieldValue;
  }

  @reactive
  public render() {
    const value = this.getValue();
    const { prefix, suffix } = this.props;
    const dataType = this.collectionField?.dataType;

    let content = '';

    if (value === null || value === undefined) {
      content = ''; // null/undefined 显示为空
    } else {
      switch (dataType) {
        case 'boolean':
          content = String(value);
          break;
        case 'number':
        case 'double':
          content = String(value);
          break;
        case 'string':
          content = value;
          break;
        case 'object':
        case 'array':
          try {
            content = JSON.stringify(value, null, 2);
          } catch {
            content = '[Invalid JSON]';
          }
          break;
        default:
          // 当 dataType 为空或不识别时根据值类型兜底处理
          if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
            content = String(value);
          } else if (typeof value === 'object') {
            try {
              content = JSON.stringify(value, null, 2);
            } catch {
              content = '[Invalid JSON]';
            }
          } else {
            content = String(value);
          }
          break;
      }
    }

    return (
      <span
        style={{
          display: 'inline-block',
          maxHeight: '200px',
          overflowY: 'auto',
          verticalAlign: 'top',
        }}
      >
        {prefix}
        {this.translate(content)}
        {suffix}
      </span>
    );
  }
}

ReadPrettyFieldModel.registerFlow({
  key: 'readPrettyFieldSettings',
  auto: true,
  title: escapeT('Read pretty field settings'),
  sort: 100,
  steps: {
    init: {
      handler(ctx, params) {
        const { collectionField } = ctx.model;
        ctx.model.setProps(collectionField.getComponentProps());
        if (collectionField.enum.length) {
          ctx.model.setProps({ dataSource: collectionField.enum });
        }
      },
    },
    model: {
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const classes = [...ctx.model.collectionField.getSubclassesOf('ReadPrettyFieldModel').keys()];
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => ({
              label: model,
              value: model,
            })),
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          use: ctx.model.use,
        };
      },
      async handler(ctx, params) {
        console.log('Sub model step1 handler');
        if (!params.use) {
          throw new Error('model use is a required parameter');
        }
        console.log('ctx.model', ctx.model);
        if (ctx.model.use !== params.use) {
          const newModel = await ctx.engine.replaceModel(ctx.model.uid, {
            use: params.use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
              readPrettyFieldSettings: {
                model: {
                  use: params.use,
                },
              },
            },
          });
          await newModel.applyAutoFlows(ctx);
        }
      },
    },
  },
});
