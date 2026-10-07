import type { AIEmployeeManager, ToolsManager } from '@nocobase/ai-employee';
import { AIResourceRegistrar } from '@nocobase/app-plugin-ai-employee/server';

import iris from './employees/iris.js';
import ticketHistoryTool from './tools/ticket-history.js';

/** Registers the example's employee and tool into the AI manager the AI Employee plugin owns. */
export class AIEmployeeExampleResources extends AIResourceRegistrar {
  protected override async registerAIEmployees(
    manager: AIEmployeeManager,
  ): Promise<void> {
    await manager.registerEmployee(iris);
  }

  protected override async registerTools(manager: ToolsManager): Promise<void> {
    await manager.registerTools(ticketHistoryTool);
  }
}
