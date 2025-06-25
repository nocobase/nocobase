/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '../../base/FieldModel';

export class ReadPrettyFieldModel extends FieldModel {
  getValue() {
    return this.ctx.shared.value;
  }

  public render() {
    return (
      <span>
        {this.props.prefix}
        {this.getValue()}
        {this.props.suffix}
      </span>
    );
  }
}
