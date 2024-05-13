/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidFilter } from '@nocobase/utils';

const mustHaveFilter = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const options = args[0];

    if (Array.isArray(options.values)) {
      return oldValue.apply(this, args);
    }

    if (!isValidFilter(options?.filter) && !options?.filterByTk && !options?.forceUpdate) {
      throw new Error(`must provide filter or filterByTk for ${propertyKey} call, or set forceUpdate to true`);
    }

    return oldValue.apply(this, args);
  };

  return descriptor;
};

export default mustHaveFilter;
