/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ResourceManager } from '@nocobase/resourcer';
import { DocumentManager } from './document-manager';
import { DefaultToolsManager, ToolsManager } from './tools-manager';
import resource from './resource';
import { ACL } from '@nocobase/acl';

export class AIManager {
  documentManager: DocumentManager;
  toolsManager: ToolsManager;

  constructor(protected readonly options: { resourceManager: ResourceManager; acl: ACL }) {
    const { resourceManager, acl } = this.options;
    this.documentManager = new DocumentManager();
    this.toolsManager = new DefaultToolsManager();

    resourceManager.define(resource);
    acl.allow('core-ai', 'getTools', 'loggedIn');
    acl.allow('core-ai', 'listTools', 'loggedIn');
  }
}
