/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { FieldModel } from '../base';

export class DisplayURLFieldModel extends FieldModel {
  // @reactive
  public render() {
    const { value } = this.props;
    const content = value && (
      <a target="_blank" rel="noopener noreferrer" href={value} style={{ overflowWrap: 'anywhere' }}>
        {value}
      </a>
    );
    return <>{content}</>;
  }
}

DisplayURLFieldModel.define({
  label: escapeT('URL'),
});

DisplayItemModel.bindModelToInterface('URLReadPrettyFieldModel', ['url'], {
  isDefault: true,
});
