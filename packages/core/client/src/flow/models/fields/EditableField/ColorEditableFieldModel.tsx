/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import React from 'react';
import { ColorPicker as AntdColorPicker } from 'antd';
import { FormFieldModel } from './FormFieldModel';

export const ColorPicker = (props) => {
  const componentProps = {
    ...props,
    trigger: 'hover',
    style: { maWidth: 30 },
    destroyTooltipOnHide: true,
    onChange: (color) => {
      props.onChange(color.toHexString());
    },
    presets: [
      {
        label: tval('Recommended'),
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
  return <AntdColorPicker {...componentProps} />;
};

export class ColorEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['color'];

  get component() {
    return [ColorPicker, {}];
  }
}
