/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { ColorPicker } from 'antd';
import React from 'react';
import { FieldModel } from '../base';

export class DisplayColorFieldModel extends FieldModel {
  public render() {
    const { value } = this.props;
    if (!value) {
      return null;
    }
    return (
      <div
        role="button"
        aria-label="color-picker-read-pretty"
        className={css`
          display: inline-flex;
          .ant-color-picker-trigger-disabled {
            cursor: default;
          }
        `}
      >
        <ColorPicker disabled value={value} size="small" />
      </div>
    );
  }
}

DisplayItemModel.bindModelToInterface('DisplayColorFieldModel', ['color'], {
  isDefault: true,
});
