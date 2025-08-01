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
    if (options instanceof FilterItem) {
      return options;
    }
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

type FilterGroupOptions = {
  logic: '$and' | '$or';
  items: Array<FilterItem | FilterOptions | FilterGroup | FilterGroupOptions>;
};
export class FilterGroup {
  protected options: {
    logic: '$and' | '$or';
    items: Array<FilterItem | FilterGroup>;
  };
  constructor(options: FilterGroupOptions) {
    if (options instanceof FilterGroup) {
      return options;
    }
    if (options.logic !== '$and' && options.logic !== '$or') {
      throw new Error('Logic must be either $and or $or');
    }
    if (!Array.isArray(options.items)) {
      throw new Error('Items must be an array');
    }
    this.options = {
      logic: options.logic,
      items: options.items.map((item: any) => {
        if (item.logic) {
          return new FilterGroup(item);
        }
        return new FilterItem(item);
      }),
    };
  }

  toJSON() {
    return {
      [this.options.logic]: this.options.items.map((item) => {
        return item.toJSON();
      }),
    };
  }
}
