/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps } from '@formily/react';
import { ColorPicker as AntdColorPicker } from 'antd';
import { tval } from '@nocobase/utils/client';
import { EditableFieldModel } from './EditableFieldModel';

const ColorPicker = connect(
  AntdColorPicker,
  mapProps((props: any, field: any) => {
    return {
      ...props,
      trigger: 'hover',
      destroyTooltipOnHide: true,
      onChange: (color) => {
        field.setValue(color.toHexString());
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
  }),
);
export class ColorEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['color'];

  get component() {
    return [ColorPicker, {}];
  }
}
