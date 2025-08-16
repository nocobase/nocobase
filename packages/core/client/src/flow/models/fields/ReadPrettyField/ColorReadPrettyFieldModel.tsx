/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ColorPicker } from 'antd';
import { css } from '@emotion/css';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

export class ColorReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['color'];
  public render() {
    const { value } = this.props;

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
