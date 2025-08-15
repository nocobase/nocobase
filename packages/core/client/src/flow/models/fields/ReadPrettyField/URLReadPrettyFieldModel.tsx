/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { reactive } from '@nocobase/flow-engine';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

export class URLReadPrettyFieldModel extends ReadPrettyFieldModel {
  static readonly supportedFieldInterfaces = ['url'];

  // @reactive
  public render() {
    const { value } = this.props;
    const content = value && (
      <a target="_blank" rel="noopener noreferrer" href={value}>
        {value}
      </a>
    );
    return <>{content}</>;
  }
}
