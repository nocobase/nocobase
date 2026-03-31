/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../base';

export class DisplayPasswordFieldModel extends FieldModel {
  public render() {
    const { value, style, className } = this.props;
    if (!value) {
      return <div className={className} style={style}></div>;
    }
    return (
      <div className={className} style={style}>
        ********
      </div>
    );
  }
}

DisplayItemModel.bindModelToInterface('DisplayPasswordFieldModel', ['password'], {
  isDefault: true,
});
