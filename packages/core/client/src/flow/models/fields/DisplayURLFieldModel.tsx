/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import React from 'react';
import { DisplayTitleFieldModel } from './DisplayTitleFieldModel';

export class DisplayURLFieldModel extends DisplayTitleFieldModel {
  public renderComponent(value) {
    const content = value && (
      <a target="_blank" rel="noopener noreferrer" href={value} style={{ overflowWrap: 'anywhere' }}>
        {value}
      </a>
    );
    return <>{content}</>;
  }
}

DisplayURLFieldModel.define({
  label: tExpr('URL'),
});

DisplayItemModel.bindModelToInterface('DisplayURLFieldModel', ['url'], {
  isDefault: true,
  when: (ctx) => {
    return true;
  },
});
