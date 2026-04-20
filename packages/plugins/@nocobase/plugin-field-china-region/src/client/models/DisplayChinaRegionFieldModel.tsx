/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FieldModel } from '@nocobase/client';
import { DisplayItemModel } from '@nocobase/flow-engine';

export class DisplayChinaRegionFieldModel extends FieldModel {
  render() {
    const { value } = this.props;

    if (!value || (Array.isArray(value) && value.length === 0)) {
      return null;
    }

    // Handle array of region objects
    if (Array.isArray(value)) {
      const sorted = [...value].sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        return (a.sort || 0) - (b.sort || 0);
      });
      const names = sorted.map((item) => item.name || item.label || item).filter(Boolean);
      return <span>{names.join('/')}</span>;
    }

    // Handle single value
    if (typeof value === 'object' && value.name) {
      return <span>{value.name}</span>;
    }

    // Handle string value
    return <span>{String(value)}</span>;
  }
}

DisplayItemModel.bindModelToInterface('DisplayChinaRegionFieldModel', ['chinaRegion'], { isDefault: true });
