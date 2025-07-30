/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { model } from '@formily/reactive';
import { AIEmployee } from '../types';

interface ContextAwareState {
  aiEmployees: AIEmployee[];

  setAIEmployees: (aiEmployees: AIEmployee[]) => void;
}

export const contextAware = model<ContextAwareState>({
  aiEmployees: [],
  setAIEmployees(aiEmployees: AIEmployee[]) {
    this.aiEmployees = aiEmployees;
  },
});
