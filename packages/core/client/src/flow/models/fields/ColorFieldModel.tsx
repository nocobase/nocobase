/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ColorPicker as AntdColorPicker } from 'antd';
import { EditableItemModel, tExpr, useFlowEngineContext } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

export const NBColorPicker = (props) => {
  const ctx = useFlowEngineContext();
  const componentProps = {
    ...props,
    trigger: 'hover',
    style: { maWidth: 30 },
    destroyTooltipOnHide: true,
    onChange: (color) => {
      if (color?.cleared) {
        props.onChange(null);
      } else {
        props.onChange(color.toHexString());
      }
    },
    presets: [
      {
        label: ctx.t('Recommended'),
        colors: [
          '#8BBB11',
          '#52C41A',
          '#13A8A8',
          '#1677FF',
          '#F5222D',
          '#FADB14',
          '#FA8C164D',
          '#FADB144D',
          '#52C41A4D',
          '#1677FF4D',
          '#2F54EB4D',
          '#722ED14D',
          '#EB2F964D',
        ],
      },
    ],
  };
  return <AntdColorPicker allowClear {...componentProps} />;
};

export class ColorFieldModel extends FieldModel {
  render() {
    return <NBColorPicker {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('ColorFieldModel', ['color'], {
  isDefault: true,
});
