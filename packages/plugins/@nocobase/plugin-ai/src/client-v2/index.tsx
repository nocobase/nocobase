/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { lazy } from '@nocobase/client';
import { AIManager } from '../client/manager/ai-manager';
import { FlowModelsContext } from '../client/ai-employees/context/flow-models';
import { AIConfigRepository } from '../client/repositories/AIConfigRepository';
import { AIEmployeeButtonModel } from './ai-employees/flow-models';

const { AIEmployeesProvider } = lazy(() => import('../client/ai-employees/AIEmployeesProvider'), 'AIEmployeesProvider');

export class PluginAIClientV2 extends Plugin {
  aiManager = new AIManager();

  async load() {
    this.app.use(AIEmployeesProvider);
    this.flowEngine.context.defineProperty('aiConfigRepository', {
      value: new AIConfigRepository(this.app.apiClient, {
        toolsManager: this.app.aiManager.toolsManager,
      }),
    });
    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.flowEngine.registerModels({
      AIEmployeeButtonModel,
    });
  }
}

export default PluginAIClientV2;

export { AIEmployeeProfileCard } from './ai-employees/ProfileCard';
export { AIEmployeeShortcut } from './ai-employees/AIEmployeeShortcut';
export { AIEmployeeButtonModel } from './ai-employees/flow-models';
export { avatars, avatarsMap } from './ai-employees/avatars';
export type { AIEmployee, Task } from './ai-employees/types';
export { formatModelLabel } from './llm-services/model-label';
