/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '@nocobase/client-v2';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { tExpr } from '../locale';

export class DisplayChinaRegionFieldModel extends FieldModel {
  render() {
    const { value } = this.props;

    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    if (Array.isArray(value)) {
      const sorted = [...value].sort((left, right) => {
        if (left.level !== right.level) {
          return left.level - right.level;
        }
        return (left.sort || 0) - (right.sort || 0);
      });
      const names = sorted.map((item) => item.name || item.label || item).filter(Boolean);
      return <span>{names.join('/')}</span>;
    }

    if (typeof value === 'object' && value.name) {
      return <span>{value.name}</span>;
    }

    return <span>{String(value)}</span>;
  }
}

DisplayChinaRegionFieldModel.define({
  label: tExpr('China region'),
});

DisplayItemModel.bindModelToInterface('DisplayChinaRegionFieldModel', ['chinaRegion'], { isDefault: true });
