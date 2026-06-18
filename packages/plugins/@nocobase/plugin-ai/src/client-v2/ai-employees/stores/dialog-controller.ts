/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@nocobase/flow-engine';

type DialogController = {
  shouldHide: boolean;
  hide: () => void;
  resume: () => void;
};

export const dialogController = observable<DialogController>({
  shouldHide: false,
  hide() {
    this.shouldHide = true;
  },
  resume() {
    this.shouldHide = false;
  },
});
