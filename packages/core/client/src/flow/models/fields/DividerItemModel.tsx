/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@nocobase/flow-engine';
import { Divider, theme } from 'antd';
import React from 'react';
import { CommonItemModel } from '../base';
import { NBColorPicker } from '../fields/ColorFieldModel';

const resolveThemeColor = (value: string | undefined, fallback: string) => {
  return value ? value : fallback;
};

const DividerItem = (props: any) => {
  const { token } = theme.useToken();
  const { color, borderColor, label, orientation, dashed } = props;

  return (
    <Divider
      type="horizontal"
      style={{
        color: resolveThemeColor(color, token.colorText),
        borderColor: resolveThemeColor(borderColor, token.colorSplit),
      }}
      orientationMargin="0"
      orientation={orientation}
      dashed={dashed}
    >
      {label}
    </Divider>
  );
};

export class DividerItemModel extends CommonItemModel {
  render() {
    return (
      <FormItem shouldUpdate showLabel={false}>
        <DividerItem {...this.props} />
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
      defaultParams: (ctx) => ({
        label: '{{t("Text")}}',
        orientation: 'left',
        color: ctx.themeToken?.colorText,
        borderColor: ctx.themeToken?.colorSplit,
      }),
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
