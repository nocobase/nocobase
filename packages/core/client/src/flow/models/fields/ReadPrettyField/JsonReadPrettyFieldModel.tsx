/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { cx, css } from '@emotion/css';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

const JSONClassName = css`
  margin-bottom: 0;
  line-height: 1.5;
  font-size: 90%;
`;

export class JsonReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['json'];
  public render() {
    const value = this.getValue();
    const { space, style, className } = this.props;

    let content = '';
    if (value !== undefined && value !== null) {
      try {
        content = JSON.stringify(value, null, space ?? 2);
      } catch (error) {
        content = this.flowEngine.translate('Invalid JSON format');
      }
    }

    return (
      <pre className={cx(className, JSONClassName)} style={style}>
        {content}
      </pre>
    );
  }
}
