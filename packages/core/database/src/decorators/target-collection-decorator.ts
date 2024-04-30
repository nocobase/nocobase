/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';

const injectTargetCollection = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  const oldValue = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const options = args[0];
    const values = options.values;

    if (lodash.isPlainObject(values) && values.__collection) {
      options.targetCollection = values.__collection;
    }

    return oldValue.apply(this, args);
  };

  return descriptor;
};

export default injectTargetCollection;
