/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Icon } from '../../../flow-compat';
import React from 'react';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base/FieldModel';

export class DisplayIconFieldModel extends FieldModel {
  public render() {
    const { value, style, className } = this.props;
    return <Icon type={value} style={style} className={className} />;
  }
}

DisplayItemModel.bindModelToInterface('DisplayIconFieldModel', ['icon'], {
  isDefault: true,
});
