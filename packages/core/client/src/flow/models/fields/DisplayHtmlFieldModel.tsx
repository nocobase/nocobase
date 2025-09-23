/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import React from 'react';
import { css } from '@emotion/css';
import { Typography } from 'antd';
import { DisplayMarkdown } from '../../internal/components/Markdown/DisplayMarkdown';
import { FieldModel } from '../base';

export class DisplayHtmlFieldModel extends FieldModel {
  public render() {
    const { textOnly = true, value, overflowMode, ...restProps } = this.props;
    const display = <DisplayMarkdown textOnly={textOnly} value={value} />;
    // 使用Typography.Text来处理overflow和换行
    const typographyProps = {
      ellipsis:
        overflowMode === 'ellipsis'
          ? {
              tooltip: {
                rootClassName: css`
                  .ant-tooltip-inner {
                    color: #000;
                  }
                `,
                color: '#fff',
              },
            }
          : false, // 处理省略显示
      style: {
        whiteSpace: overflowMode === 'wrap' ? 'normal' : 'nowrap', // 控制换行
        width: restProps.width || 'auto',
        color: 'inherit',
      },
    };

    // 使用 Typography.Text 自带的 tooltip
    const textContent = <Typography.Text {...typographyProps}>{display}</Typography.Text>;
    return textContent;
  }
}

DisplayHtmlFieldModel.registerFlow({
  key: 'htmlFieldSettings',
  title: tval('Content settings'),
  sort: 200,
  steps: {
    renderMode: {
      use: 'renderMode',
    },
    overflowMode: {
      title: escapeT('Content overflow display mode'),
      use: 'overflowMode',
    },
  },
});

DisplayItemModel.bindModelToInterface('DisplayHtmlFieldModel', ['markdown', 'richText'], {
  isDefault: true,
});
