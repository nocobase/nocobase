/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  syncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
    sync = true;
    validateEvent() {
      return true;
    }
  },
  asyncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
    validateEvent() {
      return true;
    }
  },
};
