/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '../application';
import { DefaultToolsManager, ToolsManager } from './tools-manager';

export class AIManager {
  toolsManager: ToolsManager;

  constructor(protected readonly app: Application) {
    this.toolsManager = new DefaultToolsManager(this.app);
  }
}
