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
import { Icon } from '../../../icon';
import { InteractiveDisplayFieldModel } from './InteractiveDisplayFieldModel';

export class DisplayIconFieldModel extends InteractiveDisplayFieldModel {
  public static readonly supportedFieldInterfaces = ['icon'];
  public renderDisplayValue(value) {
    return <Icon type={value} />;
  }
}

DisplayItemModel.bindModelToInterface('DisplayIconFieldModel', ['icon'], {
  isDefault: true,
});
