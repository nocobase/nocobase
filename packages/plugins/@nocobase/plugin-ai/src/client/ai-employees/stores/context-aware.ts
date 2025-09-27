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
  showed: string[];

  setAIEmployees: (aiEmployees: AIEmployee[]) => void;
  isShowed(uid: string): boolean;
  addShowed(uid: string);
  clearShowed();
}

export const contextAware = model<ContextAwareState>({
  aiEmployees: [],
  showed: [],
  setAIEmployees(aiEmployees: AIEmployee[]) {
    this.aiEmployees = aiEmployees;
  },

  isShowed(uid: string) {
    return this.showed.includes(uid);
  },

  addShowed(uid: string) {
    this.showed.push(uid);
  },

  clearShowed() {
    this.showed = [];
  },
});
