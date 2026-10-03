import { fileStorageFactoryToken } from '@nocobase/ai-employee';
import { cachingToken } from '@nocobase/app-server/caching';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import {
  ManagerFactory,
  managerFactoryToken,
} from '../server/factory/manager-factory.js';
import {
  RepositoryFactory,
  repositoryFactoryToken,
} from '../server/factory/repository-factory.js';
import {
  ServiceFactory,
  serviceFactoryToken,
} from '../server/factory/service-factory.js';
import { aiManagerToken } from '../server/provider/ai-employee.js';
import {
  AgentServiceFactory,
  agentServiceFactoryToken,
} from '../server/agent/service/agent-service-factory.js';
import type { AgentProviders } from '../server/agent/types.js';
import { createTestAppDeps } from './app/test-app-deps.js';
import { TestAIResourceRegistrar } from './app/test-context.js';

import {
  AgentServiceFactory,
  agentServiceFactoryToken,
} from '../server/agent/service/agent-service-factory.js';
import { AgentService } from '../server/agent/service/agent-service.js';
async function createContainer(): Promise<ServiceContainer> {
  const deps = await createTestAppDeps();
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, deps.database);
  container.instance(idGeneratorToken, deps.idGenerator);
  container.instance(loggingToken, deps.logging);
  container.instance(cachingToken, deps.caching);
  container.instance(fileStorageFactoryToken, deps.fileStorageFactory);
  container.instance(aiManagerToken, deps.ai);
  container.singleton(
    repositoryFactoryToken,
    (resolver) => new RepositoryFactory({ container: resolver }),
  );
  container.singleton(
    managerFactoryToken,
    (resolver) => new ManagerFactory({ container: resolver }),
  );
  container.singleton(
    serviceFactoryToken,
    () => new ServiceFactory({ container }),
  );
  container.singleton(
    agentServiceFactoryToken,
    (resolver) => new AgentServiceFactory({ container: resolver }),
  );
  return container;
}

describe('AI employee container-scoped factories', () => {
  it('keeps lazy singleton bindings and getter instances inside one container', async () => {
    const container = await createContainer();

    expect(container.resolveIfCreated(repositoryFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(managerFactoryToken)).toBeUndefined();
    expect(container.resolveIfCreated(serviceFactoryToken)).toBeUndefined();

    const repositories = container.resolve(repositoryFactoryToken);
    const managers = container.resolve(managerFactoryToken);
    const services = container.resolve(serviceFactoryToken);
    managers.configure({ aiStorageDisk: 'local' });
    services.configure({
      llmServices: {},
      resourceRegistrar: new TestAIResourceRegistrar(),
    });

    expect(container.resolve(repositoryFactoryToken)).toBe(repositories);
    expect(container.resolve(managerFactoryToken)).toBe(managers);
    expect(container.resolve(serviceFactoryToken)).toBe(services);
    expect(repositories.aiEmployees).toBe(repositories.aiEmployees);
    expect(managers.aiEmployeesManager).toBe(managers.aiEmployeesManager);
    expect(managers.fileStorage).toBe(managers.fileStorage);
    expect(managers.documentLoaders).toBe(managers.documentLoaders);
    expect(managers.subAgentsDispatcher).toBe(managers.subAgentsDispatcher);
    expect(services.modelService).toBe(services.modelService);
    expect(services.toolService).toBe(services.toolService);
  });
  it('creates a Fixed AgentService through the registered container factory', async () => {
    const container = await createContainer();
    container
      .resolve(managerFactoryToken)
      .configure({ aiStorageDisk: 'local' });
    const factory = container.resolve(agentServiceFactoryToken);
    const ai = container.resolve(aiManagerToken);
    const provider = {
      createModel: vi.fn(() => ({ invoke: vi.fn(), stream: vi.fn() })),
      resolveTools: vi.fn(() => []),
    };
    vi.spyOn(ai.llmProviderManager, 'resolveModel').mockResolvedValue({
      provider: 'test',
      llmService: 'test-service',
      model: 'test-model',
    });
    vi.spyOn(ai.llmProviderManager, 'getLLMService').mockResolvedValue({
      provider,
      service: { name: 'test-service', provider: 'test' },
    } as never);
    const fixedAgent = {
      actor: { id: 1, roles: [], isRoot: false },
      runtime: { logger: { warn: vi.fn(), error: vi.fn() } as never },
    };
    const agent = await factory.createAgent({
      sessionId: 'factory-session',
      ...fixedAgent,
    });
    expect(agent).toBeInstanceOf(AgentService);
    const second = await factory.createAgent({
      sessionId: 'factory-session-2',
      ...fixedAgent,
    });
    const firstProviders = (agent as unknown as { providers: AgentProviders })
      .providers;
    const secondProviders = (second as unknown as { providers: AgentProviders })
      .providers;
    expect(firstProviders.conversation.messages).not.toBe(
      secondProviders.conversation.messages,
    );
    expect(firstProviders.conversation.streamCache).not.toBe(
      secondProviders.conversation.streamCache,
    );
    expect(firstProviders.conversation.event).not.toBe(
      secondProviders.conversation.event,
    );
    expect(firstProviders.conversation.abort).not.toBe(
      secondProviders.conversation.abort,
    );
  });

  it('isolates repositories, services, readiness and mutable managers by container', async () => {
    const firstContainer = await createContainer();
    const secondContainer = await createContainer();
    const firstManagers = firstContainer.resolve(managerFactoryToken);
    const secondManagers = secondContainer.resolve(managerFactoryToken);
    const first = firstContainer.resolve(serviceFactoryToken);
    const second = secondContainer.resolve(serviceFactoryToken);
    firstManagers.configure({ aiStorageDisk: 'local' });
    secondManagers.configure({ aiStorageDisk: 'local' });
    first.configure({
      llmServices: {},
      resourceRegistrar: new TestAIResourceRegistrar(),
    });
    second.configure({
      llmServices: {},
      resourceRegistrar: new TestAIResourceRegistrar(),
    });

    expect(first).not.toBe(second);
    expect(firstContainer.resolve(repositoryFactoryToken)).not.toBe(
      secondContainer.resolve(repositoryFactoryToken),
    );
    expect(first.conversationService).not.toBe(second.conversationService);
    await expect(first.ready()).rejects.toThrow('has not been initialized');
    await expect(second.ready()).rejects.toThrow('has not been initialized');

    expect(firstManagers.fileStorage).not.toBe(secondManagers.fileStorage);
    expect(firstManagers.documentLoaders).not.toBe(
      secondManagers.documentLoaders,
    );
    expect(firstManagers.aiEmployeesManager).not.toBe(
      secondManagers.aiEmployeesManager,
    );
    expect(first).not.toHaveProperty('createRequestRuntime');
    expect(second).not.toHaveProperty('createRequestRuntime');
  });
});
