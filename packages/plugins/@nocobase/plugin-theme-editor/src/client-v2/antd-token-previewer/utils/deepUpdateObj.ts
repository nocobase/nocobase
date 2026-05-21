/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const deepUpdateObj = (obj: any, path: string[], value: any): any => {
  if (path.length === 0) {
    return obj;
  }
  if (path.length === 1) {
    if (value === null || value === undefined) {
      const newObj = { ...obj };
      delete newObj[path[0]];
      return newObj;
    }
    return {
      ...obj,
      [path[0]]: value,
    };
  }
  return {
    ...obj,
    [path[0]]: deepUpdateObj(obj[path[0]] ?? {}, path.slice(1), value),
  };
};

export default deepUpdateObj;
