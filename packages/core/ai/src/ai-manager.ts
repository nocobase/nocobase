/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DocumentManager } from './document-manager';
import { DefaultToolsManager, ToolsManager } from './tools-manager';
import { DefaultSkillsManager, SkillsManager } from './skills-manager';

export class AIManager {
  documentManager: DocumentManager;
  toolsManager: ToolsManager;
  skillsManager: SkillsManager;

  constructor(protected readonly app: any) {
    this.documentManager = new DocumentManager();
    this.toolsManager = new DefaultToolsManager();
    this.skillsManager = new DefaultSkillsManager(() => app.mainDataSource);
  }
}
