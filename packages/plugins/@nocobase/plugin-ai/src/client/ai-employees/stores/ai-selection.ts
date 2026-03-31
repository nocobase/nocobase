/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { model } from '@formily/reactive';
import { Selector } from '../types';

interface AISelectionState {
  selectable: string;
  selector?: Selector;
  startSelect: (selectType: string, selector?: Selector) => void;
  stopSelect: () => void;
}

export const aiSelection = model<AISelectionState>({
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
