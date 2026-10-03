import { fileStorageFactoryToken } from '@nocobase/ai-employee';
import { cachingToken } from '@nocobase/app-server/caching';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { createLogging } from '@nocobase/logging';
import { ServiceContainer } from '@nocobase/service-provider';

import type { AgentContext, AgentState } from '@nocobase/ai-employee';
import { createAgentContext } from '../../server/agent/context.js';
import type { Actor } from '../../server/types.js';
import {
  ManagerFactory,
  managerFactoryToken,
} from '../../server/factory/manager-factory.js';
import {
  RepositoryFactory,
  repositoryFactoryToken,
} from '../../server/factory/repository-factory.js';
import {
  ServiceFactory,
  serviceFactoryToken,
} from '../../server/factory/service-factory.js';
import { aiManagerToken } from '../../server/provider/ai-employee.js';
import {
  AgentServiceFactory,
  agentServiceFactoryToken,
} from '../../server/agent/service/agent-service-factory.js';
import { createTestAppDeps } from './test-app-deps.js';
import { AIResourceRegistrar } from '../../server/ai/index.js';
import type { AIEmployeeManager, ToolsManager } from '@nocobase/ai-employee';

export function createTestActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: 'fixture-user',
    roles: ['member'],
    isRoot: false,
    ...overrides,
  };
}

export function createTestAgentState(
  overrides: Partial<AgentState> = {},
): AgentState {
  return { sessionId: 'test-session', ...overrides };
}

export class TestAIResourceRegistrar extends AIResourceRegistrar {
  protected override async registerAIEmployees(
    _aiEmployeeManager: AIEmployeeManager,
  ): Promise<void> {}

  protected override async registerTools(
    _toolsManager: ToolsManager,
  ): Promise<void> {}
}

export async function createTestAIEmployeeFixture() {
  const deps = await createTestAppDeps();
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, deps.database);
  container.instance(cachingToken, deps.caching);
  container.instance(fileStorageFactoryToken, deps.fileStorageFactory);
  container.instance(idGeneratorToken, deps.idGenerator);
  container.instance(loggingToken, deps.logging);
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
  const services = container.resolve(serviceFactoryToken);
  container.resolve(managerFactoryToken).configure({
    aiStorageDisk: deps.aiStorageDisk,
  });
  services.configure({
    llmServices: {},
    resourceRegistrar: new TestAIResourceRegistrar(),
  });
  const managers = container.resolve(managerFactoryToken);
  const repositories = container.resolve(repositoryFactoryToken);
  return { container, deps, repositories, managers, services };
}

export function createTestAgentContext({
  actor = createTestActor(),
  state = createTestAgentState(),
}: {
  actor?: Actor;
  state?: AgentState;
} = {}): AgentContext {
  return createAgentContext({
    actor,
    state,
    runtime: {
      logger: createLogging({ level: 'silent' }).getLogger('ai-employee-test'),
    },
  });
}

/**
 * The context a tool that declared `dependencies` receives. Tests build it the
 * way `AgentService` does: the execution context plus that tool's own deps.
 */
export function withTestToolDeps<TDeps>(
  context: AgentContext,
  deps: TDeps,
): AgentContext<TDeps> {
  return { ...context, deps };
}
