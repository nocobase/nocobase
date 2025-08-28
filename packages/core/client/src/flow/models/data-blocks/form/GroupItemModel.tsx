/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Divider } from 'antd';
import React from 'react';
import { FormCustomFormItemModel } from './FormCustomFormItemModel';
import { FormItem } from './FormItem/FormItem';
import { NBColorPicker } from '../../fields/ColorFieldModel';

export class GroupItemModel extends FormCustomFormItemModel {
  render() {
    const { color, borderColor, title, orientation, dashed } = this.props;
    console.log(color);
    return (
      <FormItem shouldUpdate showLabel={false}>
        <Divider
          type="horizontal"
          style={{ color, borderColor }}
          orientationMargin="0"
          orientation={orientation}
          dashed={dashed}
        >
          {title}
        </Divider>
      </FormItem>
    );
  }
}

GroupItemModel.registerFlow({
  key: 'markdownItemSetting',
  title: '{{t("Markdown Setting")}}',
  steps: {
    title: {
      title: '{{t("Edit group title")}}',
      defaultParams: {
        title: '{{t("Group")}}',
      },
      uiSchema(ctx) {
        return {
          title: {
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: true,
            },
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          title: params.title,
        });
      },
    },
    titlePosition: {
      title: '{{t("Title position")}}',
      uiSchema(ctx) {
        return {
          orientation: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              { label: ctx.t('Left'), value: 'left' },
              { label: ctx.t('Center'), value: 'center' },
              { label: ctx.t('Right'), value: 'right' },
            ],
          },
        };
      },
      defaultParams: {
        orientation: 'left',
      },
      handler(ctx, params) {
        ctx.model.setProps({
          orientation: params.orientation,
        });
      },
    },
    dashed: {
      title: '{{t("Dashed")}}',
      uiSchema(ctx) {
        return {
          dashed: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          dashed: params.dashed,
        });
      },
    },
    color: {
      title: '{{t("Color")}}',
      defaultParams: {
        color: 'rgba(0, 0, 0, 0.88)',
      },
      uiSchema(ctx) {
        return {
          color: {
            'x-component': NBColorPicker,
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          color: params.color,
        });
      },
    },
    borderColor: {
      title: '{{t("Divider line color")}}',
      defaultParams: {
        borderColor: 'rgba(5, 5, 5, 0.06)',
      },
      uiSchema(ctx) {
        return {
          borderColor: {
            'x-component': NBColorPicker,
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          borderColor: params.borderColor,
        });
      },
    },
  },
});

GroupItemModel.define({
  label: '{{t("Add group")}}',
});
