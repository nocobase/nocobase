/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@nocobase/flow-engine';
import type { Selector } from '../types';

type AISelectionState = {
  selectable: string;
  selector?: Selector | null;
  startSelect: (selectType: string, selector?: Selector) => void;
  stopSelect: () => void;
};

export const aiSelection = observable<AISelectionState>({
  selectable: '',
  selector: null,
  startSelect(selectType: string, selector?: Selector) {
    this.selectable = selectType;
    this.selector = selector;
  },
  stopSelect() {
    this.selectable = '';
    this.selector = null;
  },
});
