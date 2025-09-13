/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { cx, css } from '@emotion/css';
import { FieldModel } from '../base/FieldModel';

const JSONClassName = css`
  margin-bottom: 0;
  line-height: 1.5;
  font-size: 90%;
`;

export class DisplayJSONFieldModel extends FieldModel {
  public static readonly supportedFieldInterfaces = ['json'];
  public render() {
    const { space, style, className, value } = this.props;
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

DisplayItemModel.bindModelToInterface('DisplayJSONFieldModel', ['json'], {
  isDefault: true,
});
