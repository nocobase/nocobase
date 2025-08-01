/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FilterOptions = {
  key: string;
  value: any;
  operator?: string;
};
export class FilterItem {
  constructor(protected options: FilterOptions) {
    this.options = options;
  }
  toJSON() {
    if (this.options.operator) {
      return {
        [this.options.key]: {
          [this.options.operator]: this.options.value,
        },
      };
    }
    return {
      [this.options.key]: this.options.value,
    };
  }
}
