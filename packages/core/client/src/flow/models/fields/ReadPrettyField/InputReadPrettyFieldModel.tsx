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

export class InputReadPrettyFieldModel extends ReadPrettyFieldModel {
  static supportedFieldInterfaces = [
    'input',
    'email',
    'phone',
    'uuid',
    'attachmentURL',
    'textarea',
    'time',
    'nanoid',
  ] as any;

  // @reactive
  public render() {
    const { prefix, suffix, value } = this.props;

    return (
      <span>
        {prefix}
        {this.translate(value)}
        {suffix}
      </span>
    );
  }
}
