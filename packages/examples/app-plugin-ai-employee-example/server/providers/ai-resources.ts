import { aiManagerToken } from '@nocobase/app-plugin-ai-employee/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { AIEmployeeExampleResources } from '../ai/index.js';

export class AIEmployeeExampleResourcesProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-ai-employee-example/ai-resources';

  // boot(), not register(): the AI Employee plugin's provider must have booted first, which moves its AI manager
  // onto the database, so the employee registered here is persisted beside the built-in ones. The application lists
  // that plugin before this one.
  public override async boot(): Promise<void> {
    const ai = this.app.container.resolve(aiManagerToken);
    await new AIEmployeeExampleResources({
      source: '@nocobase/app-plugin-ai-employee-example',
    }).registerAIResources(ai);
  }
}
