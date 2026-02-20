/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@nocobase/flow-engine';
import { Divider } from 'antd';
import React from 'react';
import { CommonItemModel } from '../base';
import { NBColorPicker } from '../fields/ColorFieldModel';

export class DividerItemModel extends CommonItemModel {
  render() {
    const { color, borderColor, label, orientation, dashed } = this.props;
    return (
      <FormItem shouldUpdate showLabel={false}>
        <Divider
          type="horizontal"
          style={{ color, borderColor }}
          orientationMargin="0"
          orientation={orientation}
          dashed={dashed}
        >
          {label}
        </Divider>
      </FormItem>
    );
  }
}

DividerItemModel.registerFlow({
  key: 'markdownItemSetting',
  title: '{{t("Divider settings")}}',
  steps: {
    title: {
      title: '{{t("Edit divider")}}',
      defaultParams: {
        label: '{{t("Text")}}',
        orientation: 'left',
        color: 'rgba(0, 0, 0, 0.88)',
        borderColor: 'rgba(5, 5, 5, 0.06)',
      },
      uiSchema(ctx) {
        return {
          label: {
            title: '{{t("Divider label")}}',
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: true,
            },
          },
          orientation: {
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            title: '{{t("Label position")}}',
            enum: [
              { label: ctx.t('Left'), value: 'left' },
              { label: ctx.t('Center'), value: 'center' },
              { label: ctx.t('Right'), value: 'right' },
            ],
          },
          dashed: {
            title: '{{t("Dashed")}}',
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
          },
          color: {
            title: '{{t("Color")}}',
            'x-component': NBColorPicker,
            'x-decorator': 'FormItem',
          },
          borderColor: {
            title: '{{t("Divider line color")}}',
            'x-component': NBColorPicker,
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        let label = params.label;
        if (label && label !== ctx.t('Text')) {
          label = ctx.t(label, { ns: 'lm-flow-engine' });
        }
        ctx.model.setProps({
          ...params,
          label,
        });
      },
    },
  },
});

DividerItemModel.define({
  label: '{{t("Divider")}}',
});
