/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';

export class ReadPrettyFieldModel extends FieldModel {
  static readonly supportedFieldInterfaces = '*' as any;

  // @reactive
  public render() {
    const { prefix, suffix, value } = this.props;
    const dataType = this.context.collectionField?.dataType;
    let content = '';
    if (value === null || value === undefined) {
      content = ''; // null/undefined 显示为空
    } else {
      switch (dataType) {
        case 'boolean':
          content = String(value);
          break;
        case 'number':
        case 'double':
          content = String(value);
          break;
        case 'string':
          content = value;
          break;
        case 'object':
        case 'array':
          try {
            content = JSON.stringify(value, null, 2);
          } catch {
            content = '[Invalid JSON]';
          }
          break;
        default:
          // 当 dataType 为空或不识别时根据值类型兜底处理
          if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
            content = String(value);
          } else if (typeof value === 'object') {
            try {
              content = JSON.stringify(value, null, 2);
            } catch {
              content = '[Invalid JSON]';
            }
          } else {
            content = String(value);
          }
          break;
      }
    }

    return (
      <span
        style={{
          display: 'inline-block',
          maxHeight: '200px',
          overflowY: 'auto',
          verticalAlign: 'top',
        }}
      >
        {prefix}
        {this.translate(content)}
        {suffix}
      </span>
    );
  }
}
