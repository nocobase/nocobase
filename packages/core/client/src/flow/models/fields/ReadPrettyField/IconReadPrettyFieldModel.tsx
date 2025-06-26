/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';
import { Icon } from '../../../../icon';

export class IconReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['icon'];
  public render() {
    const value = this.getValue();

    return <Icon type={value} />;
  }
}
