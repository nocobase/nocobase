/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import type { WorkContextOptions } from '../ai-employees/types';

export class AIManager {
  workContext = new Registry<WorkContextOptions>();

  registerWorkContext(name: string, options: WorkContextOptions) {
    const [rootKey, childKey] = name.split('.');
    if (childKey) {
      const root = this.workContext.get(rootKey);
      if (!root?.children) {
        return;
      }
      root.children[childKey] = {
        name: childKey,
        ...options,
      };
      return;
    }
    this.workContext.register(name, {
      name,
      ...options,
    });
  }

  getWorkContext(name: string): WorkContextOptions | null {
    const [rootKey, childKey] = name.split('.');
    if (childKey) {
      const root = this.workContext.get(rootKey);
      if (!root?.children) {
        return null;
      }
      return root.children[childKey];
    }
    return this.workContext.get(name);
  }
}
