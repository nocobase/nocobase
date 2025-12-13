/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, tExpr } from '@nocobase/flow-engine';
import { Typography } from 'antd';
import { castArray } from 'lodash';
import { css } from '@emotion/css';
import React from 'react';
import { FieldModel } from '../base';

export class DisplayTitleFieldModel extends FieldModel {
  get collectionField(): CollectionField {
    return this.context.collectionField;
  }

  renderComponent(value) {
    return value;
  }

  /**
   * 基类统一渲染逻辑
   */
  render(): any {
    const { value, fieldNames, overflowMode, width } = this.props;
    const titleField = this.props.titleField || fieldNames?.label;
    const typographyProps = {
      ellipsis:
        overflowMode === 'ellipsis'
          ? {
              tooltip: {
                rootClassName: css`
                  .ant-tooltip-inner {
                    color: #000;
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 10px;
                  }
                `,
                color: '#fff',
              },
            }
          : false, // 处理省略显示
      style: {
        whiteSpace: overflowMode === 'wrap' ? 'normal' : 'nowrap', // 控制换行
        width: width || 'auto',
      },
    };
    if (titleField) {
      const result = castArray(value).flatMap((v, idx) => {
        const result = this.renderComponent(v?.[titleField]);
        const node = v?.[titleField] ? result : 'N/A';
        return idx === 0 ? [node] : [<span key={`sep-${idx}`}>, </span>, node];
      });
      return <Typography.Text {...typographyProps}>{result}</Typography.Text>;
    } else {
      const textContent = <Typography.Text {...typographyProps}>{this.renderComponent(value)}</Typography.Text>;
      return textContent;
    }
  }
}

DisplayTitleFieldModel.registerFlow({
  key: 'displayFieldSettings',
  title: tExpr('Display Field settings'),
  sort: 200,
  steps: {
    overflowMode: {
      use: 'overflowMode',
    },
  },
});
