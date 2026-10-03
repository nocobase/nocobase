import { describe, expect, it, vi } from 'vitest';
import { AgentServiceError } from '../server/index.js';
import { agentServiceFactoryToken } from '../server/agent/service/agent-service-factory.js';
import { managerFactoryToken } from '../server/factory/manager-factory.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';

const actor = { id: 1, roles: [], isRoot: false };

describe('agent creation errors', () => {
  it('reports a fixed agent with no usable model as a configuration error', async () => {
    const fixture = await createTestAIEmployeeFixture();
    vi.spyOn(
      fixture.deps.ai.llmProviderManager,
      'resolveModel',
    ).mockRejectedValue(new Error('LLM service not configured'));

    const created = fixture.container
      .resolve(agentServiceFactoryToken)
      .createAgent({
        sessionId: 'no-model',
        persistence: new MemoryConversationPersistence('no-model'),
        actor,
        runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      });

    await expect(created).rejects.toBeInstanceOf(AgentServiceError);
    await expect(created).rejects.toMatchObject({
      code: 'CONFIGURATION_ERROR',
      retryable: false,
      rootMessage: 'LLM service not configured',
    });
  });

  it('reports an employee with no usable model as a configuration error', async () => {
    const fixture = await createTestAIEmployeeFixture();
    const employees =
      fixture.container.resolve(managerFactoryToken).aiEmployeesManager;
    vi.spyOn(employees, 'getEmployee').mockResolvedValue({
      username: 'order-desk',
    } as never);
    vi.spyOn(employees, 'resolveModel').mockRejectedValue(
      new Error('AI employee model not configured'),
    );

    const created = fixture.container
      .resolve(agentServiceFactoryToken)
      .createAIEmployee({
        username: 'order-desk',
        state: { sessionId: 'no-model' },
        actor,
        runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      });

    await expect(created).rejects.toMatchObject({
      code: 'CONFIGURATION_ERROR',
      rootMessage: 'AI employee model not configured',
    });
  });
});
