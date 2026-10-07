import { createAIManager } from '@nocobase/ai-employee';
import { aiManagerToken } from '@nocobase/app-plugin-ai-employee/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import plugin, { AI_EMPLOYEE_EXAMPLE_EMPLOYEE } from '../server/index.js';
import { AIEmployeeExampleResourcesProvider } from '../server/providers/ai-resources.js';

describe('@nocobase/app-plugin-ai-employee-example server plugin', () => {
  it('declares its resources provider', () => {
    expect(plugin).toMatchObject({
      packageName: '@nocobase/app-plugin-ai-employee-example',
      serviceProviders: [AIEmployeeExampleResourcesProvider],
    });
  });

  it('registers its employee into the AI manager the AI Employee plugin owns when it boots', async () => {
    const container = new ServiceContainer();
    const ai = createAIManager();
    container.instance(aiManagerToken, ai);
    const provider = new AIEmployeeExampleResourcesProvider({
      container,
    } as unknown as AppPluginApplication);

    expect(
      await ai.employeeManager.getEmployee(AI_EMPLOYEE_EXAMPLE_EMPLOYEE),
    ).toBeUndefined();

    await provider.boot();

    expect(
      await ai.employeeManager.getEmployee(AI_EMPLOYEE_EXAMPLE_EMPLOYEE),
    ).toMatchObject({ username: AI_EMPLOYEE_EXAMPLE_EMPLOYEE });
  });
});
