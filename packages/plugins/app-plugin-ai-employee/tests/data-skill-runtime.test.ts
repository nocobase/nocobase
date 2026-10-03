import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { createAppAuthorization } from '@nocobase/app-plugin-authorization/server';
import {
  createDataServices,
  dataServicesFactoryToken,
} from '../server/service/data-services.js';
import { aiManagerToken } from '../server/provider/ai-employee.js';
import type { DataServices } from '../server/service/data-contracts.js';
import {
  buildTool,
  type AIEmployeeSkillSettings as EmployeeSkillSettings,
} from '@nocobase/ai-employee';
import getSkill from '../server/ai/tools/getSkill.js';
import { ToolMessage } from 'langchain';
import { describe, expect, it, vi } from 'vitest';

import type { AgentContext } from '@nocobase/ai-employee';
import { AIEmployeeResources } from '../server/ai/index.js';
import { AIEmployeeAgentContextProvider } from '../server/agent/context/ai-employee/context.js';
import type { AIEmployeeAgentContextProviderOptions } from '../server/agent/context/ai-employee/context.js';
import type { AIEmployeeSkillSettings } from '../server/agent/context/ai-employee/options.js';
import { ConversationMessageStoreImpl } from '../server/agent/conversation/message-store.js';
import { skillToolBindingMiddleware } from '../server/agent/middleware/skill-tools.js';
import { toolCallStatusMiddleware } from '../server/agent/middleware/tools.js';
import { createTestAgentContext } from './app/test-context.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';
import { createMockServer } from './mock-server.js';

/** A collection grant as a Permission Set stores it. */
function grant(
  collection: string,
  definition: Record<string, Record<string, unknown>>,
) {
  return {
    resource: { type: 'database.collection', id: collection },
    actions: Object.entries(definition).map(([action, config]) => ({
      action,
      policy: { type: 'database', ...config },
    })),
  };
}

const skillTools = {
  'data-metadata': [
    'getDataSources',
    'getCollectionNames',
    'getCollectionMetadata',
    'searchFieldMetadata',
  ],
  'data-query': ['dataSourceQuery', 'dataSourceCounting', 'dataQuery'],
  'business-analysis-report': ['businessReportGenerator', 'getSkill'],
};
const gatedTools = Object.values(skillTools)
  .flat()
  .filter((name) => name !== 'getSkill');

interface ToolRequest {
  toolCall: { id: string; name: string; args: Record<string, unknown> };
  state: { messageId: string };
  runtime: { writer: ReturnType<typeof vi.fn> };
}
type ToolHook = (
  request: ToolRequest,
  handler: (request: ToolRequest) => Promise<ToolMessage>,
) => Promise<ToolMessage>;
type ModelHook = (
  request: { tools: { name: string }[] },
  handler: (request: { tools: { name: string }[] }) => Promise<string[]>,
) => Promise<string[]>;

function hook<T>(middleware: unknown, name: string): T {
  const value = (middleware as Record<string, unknown>)[name];
  return (
    typeof value === 'function' ? value : (value as { hook: unknown }).hook
  ) as T;
}

async function createFixture(services?: DataServices) {
  const { aiManager } = await createMockServer();
  await new AIEmployeeResources().registerAIResources(aiManager);
  const persistence = new MemoryConversationPersistence('analysis');
  const metadata = {
    name: 'orders',
    dataSource: 'main',
    fields: {
      items: [{ name: 'amount', type: 'double' }],
      limit: 100,
      offset: 0,
      hasMore: false,
    },
  };
  const data = {
    getDataSources: vi.fn(async () => ({
      items: [{ name: 'main' }],
      limit: 100,
      offset: 0,
      hasMore: false,
    })),
    getCollectionNames: vi.fn(async () => ({
      items: [{ name: 'orders' }],
      limit: 100,
      offset: 0,
      hasMore: false,
    })),
    getCollectionMetadata: vi.fn(async () => metadata),
    searchFieldMetadata: vi.fn(async () => ({
      items: [
        {
          name: 'amount',
          type: 'double',
          collection: 'orders',
          match: 'exact',
        },
      ],
      limit: 100,
      offset: 0,
      hasMore: false,
    })),
    dataSourceQuery: vi.fn(async () => ({
      items: [{ amount: 42 }],
      limit: 100,
      offset: 0,
      hasMore: false,
      truncated: false,
      timezone: 'UTC',
    })),
    dataSourceCounting: vi.fn(async () => ({ count: 1 })),
    dataQuery: vi.fn(async () => ({
      items: [{ total: 42 }],
      truncated: false,
      timezone: 'UTC',
    })),
  };
  const agentContext: AgentContext = createTestAgentContext();
  // Stands in for the container: what each declared token resolves to here.
  const resolved = new Map<unknown, unknown>([
    [dataServicesFactoryToken, () => services ?? data],
    [aiManagerToken, aiManager],
  ]);
  /** Resolves one tool's declaration the way AgentService does. */
  const depsFor = (entry: {
    dependencies?: Record<string, unknown>;
  }): Record<string, unknown> =>
    Object.fromEntries(
      Object.entries(entry.dependencies ?? {}).map(([name, token]) => [
        name,
        resolved.get(token),
      ]),
    );

  async function runtime(
    settings?: AIEmployeeSkillSettings,
    sessionId = 'analysis',
    employeeSettings: Partial<EmployeeSkillSettings> = {},
  ) {
    const context: AgentContext = {
      ...agentContext,
      state: { sessionId },
    };
    const currentConversation = { sessionId, username: 'atlas' };
    const provider = new AIEmployeeAgentContextProvider({
      employee: {
        username: 'atlas',
        chatSettings: {},
        skillSettings: employeeSettings,
      },
      sessionId,
      currentConversation,
      actor: context.actor,
      agentContext: context,
      llmProviderManager: aiManager.llmProviderManager,
      toolsManager: aiManager.toolsManager,
      skillsManager: aiManager.skillsManager,
      builtInManager: { setupBuiltInInfo() {} },
      knowledgeBaseManager: { isEnabledKnowledgeBase: async () => false },
      conversations: persistence.conversations,
      toolMessages: persistence.toolMessages,
      employees: {},
      usersAiEmployees: {},
      skillSettings: settings,
    } as unknown as AIEmployeeAgentContextProviderOptions);
    const discovered = await provider.discoveredTools();
    const messages = new ConversationMessageStoreImpl({
      sessionId,
      persistence,
      conversation: persistence.createChatConversation({ sessionId }),
      getCurrentFrontendTools: async () => [],
    });
    const binding = skillToolBindingMiddleware(discovered);
    const bindTool = hook<ToolHook>(binding, 'wrapToolCall');
    const bindModel = hook<ModelHook>(binding, 'wrapModelCall');
    const status = hook<ToolHook>(
      toolCallStatusMiddleware(
        { messages },
        currentConversation,
        context.runtime.logger,
      ),
      'wrapToolCall',
    );
    const executed = vi.fn(
      async (request: ToolRequest): Promise<ToolMessage> => {
        const entry = discovered.tools.get(request.toolCall.name);
        if (!entry)
          throw new Error(`Unregistered tool: ${request.toolCall.name}`);
        const built = buildTool(entry, {
          ...context,
          deps: depsFor(entry),
        }) as unknown as {
          invoke(input: unknown, config: unknown): Promise<ToolMessage>;
        };
        return built.invoke(request.toolCall.args, {
          toolCall: request.toolCall,
          writer: request.runtime.writer,
        });
      },
    );
    let sequence = 0;
    return {
      discovered,
      executed,
      availableSkills: () => provider.getAvailableSkills(),
      visibleTools: () =>
        bindModel(
          { tools: [...discovered.tools.keys()].map((name) => ({ name })) },
          async (request) => request.tools.map((tool) => tool.name),
        ),
      async call(name: string, args: Record<string, unknown> = {}) {
        const toolCall = {
          id: `call-${sessionId}-${++sequence}`,
          name,
          args,
          type: 'tool_call' as const,
        };
        const saved = await messages.saveAssistantMessage(
          {
            role: 'assistant',
            content: { type: 'text', content: '' },
            toolCalls: [toolCall],
          },
          discovered.tools,
        );
        const messageId = String(saved.message.messageId);
        const result = await bindTool(
          { toolCall, state: { messageId }, runtime: { writer: vi.fn() } },
          (request) => status(request, executed),
        );
        return {
          result,
          stored: await messages.getToolCallResult(messageId, toolCall.id),
        };
      },
    };
  }
  return { aiManager, data, persistence, runtime };
}

describe('package-owned data skill runtime', () => {
  it('intersects persisted skill activation with employee tool selection and rejects disabled direct calls', async () => {
    const fixture = await createFixture();
    const first = await fixture.runtime();
    await first.call('getSkill', { skillName: 'data-query' });
    expect(await first.visibleTools()).toContain('dataQuery');
    const disabled = await fixture.runtime(undefined, 'analysis', {
      enabledTools: ['getSkill'],
    });
    expect(disabled.discovered.tools.has('dataQuery')).toBe(false);
    await disabled.call('getSkill', { skillName: 'data-query' });
    expect(await disabled.visibleTools()).toEqual(['getSkill']);
    expect((await disabled.call('dataQuery')).result).toMatchObject({
      status: 'error',
      content: 'Tool unavailable.',
    });
    expect(fixture.data.dataQuery).not.toHaveBeenCalled();
    const enabled = await fixture.runtime(undefined, 'analysis', {
      enabledTools: ['getSkill', 'dataQuery'],
    });
    expect(new Set(await enabled.visibleTools())).toEqual(
      new Set(['getSkill', 'dataQuery']),
    );
    const narrowed = await fixture.runtime(
      { toolsVersion: 1, tools: ['getSkill', 'dataSourceQuery'] },
      'analysis',
      {
        enabledTools: ['getSkill', 'dataQuery'],
      },
    );
    expect(await narrowed.visibleTools()).toEqual(['getSkill']);
    expect(narrowed.discovered.tools.has('dataSourceQuery')).toBe(false);
    expect(narrowed.discovered.tools.has('dataQuery')).toBe(false);
    const none = await fixture.runtime(undefined, 'analysis', {
      enabledTools: [],
    });
    expect(none.discovered.tools.size).toBe(0);
    expect(await none.visibleTools()).toEqual([]);
    expect(
      (await none.call('getSkill', { skillName: 'data-query' })).result,
    ).toMatchObject({ status: 'error', content: 'Tool unavailable.' });
  });

  it('leaves out the tools that pause an unattended run when a session names its tools', async () => {
    const fixture = await createFixture();
    const unfiltered = await fixture.runtime();
    // Every employee session gets these GENERAL tools: one asks, one runs in a
    // browser, and either one pauses a run nobody is watching.
    expect(unfiltered.discovered.tools.has('suggestions')).toBe(true);
    expect(unfiltered.discovered.tools.has('formFiller')).toBe(true);

    // data-query tells the model to load data-metadata first, so the list
    // names both Skills' tools, not only the one the query runs on.
    const unattended = await fixture.runtime({
      toolsVersion: 1,
      tools: [
        'getSkill',
        'getDataSources',
        'getCollectionNames',
        'getCollectionMetadata',
        'searchFieldMetadata',
        'dataSourceQuery',
        'dataSourceCounting',
        'dataQuery',
      ],
    });

    expect(unattended.discovered.tools.has('suggestions')).toBe(false);
    expect(unattended.discovered.tools.has('formFiller')).toBe(false);
    await unattended.call('getSkill', { skillName: 'data-query' });
    await unattended.call('getSkill', { skillName: 'data-metadata' });
    expect(await unattended.visibleTools()).toEqual(
      expect.arrayContaining(['getSkill', 'getCollectionNames', 'dataQuery']),
    );
    expect(await unattended.visibleTools()).not.toContain('suggestions');
    expect(
      (await unattended.call('getCollectionNames', { dataSource: 'main' }))
        .result,
    ).toMatchObject({ status: 'success' });
  });

  it('does not activate selected skill tools until an available skill is loaded', async () => {
    const fixture = await createFixture();
    const settings = { enabledTools: ['getSkill', 'dataQuery'] };
    const selected = await fixture.runtime(undefined, 'analysis', settings);
    expect(selected.discovered.tools.has('dataQuery')).toBe(true);
    expect(await selected.visibleTools()).toEqual(['getSkill']);
    expect((await selected.call('dataQuery')).result).toMatchObject({
      status: 'error',
    });
    await selected.call('getSkill', { skillName: 'data-query' });
    expect(await selected.visibleTools()).toContain('dataQuery');
    const disabledSkill = await fixture.runtime(undefined, 'analysis', {
      ...settings,
      enabledSkills: [],
    });
    expect(await disabledSkill.visibleTools()).toEqual(['getSkill']);
    expect((await disabledSkill.call('dataQuery')).result).toMatchObject({
      status: 'error',
    });
  });

  it('denies direct skill loads without host visibility and allows an explicit policy', async () => {
    const fixture = await createFixture();
    const context = createTestAgentContext();
    const runtime = { toolCallId: 'direct', writer: vi.fn() };
    expect(
      await getSkill.invoke(context, { skillName: 'data-query' }, runtime),
    ).toMatchObject({ status: 'error' });
    expect(
      await getSkill.invoke(
        {
          ...context,
          availableSkills: async () =>
            fixture.aiManager.skillsManager.getSkills(['data-query']),
        },
        { skillName: 'data-query' },
        runtime,
      ),
    ).toMatchObject({
      status: 'success',
      content: { skillName: 'data-query' },
    });
  });

  it('denies disabled GENERAL skills in discovery, content loading and persisted tool activation', async () => {
    const fixture = await createFixture();
    // Also cover GENERAL tools: disabling their skill must not ungate them.
    const query = await fixture.aiManager.toolsManager.getTools('dataQuery');
    await fixture.aiManager.toolsManager.registerTools({
      ...query!,
      scope: 'GENERAL',
    });
    const first = await fixture.runtime();
    await first.call('getSkill', { skillName: 'data-query' });
    expect(await first.visibleTools()).toContain('dataQuery');
    const disabled = await fixture.runtime(undefined, 'analysis', {
      enabledSkills: ['data-metadata'],
      skills: ['data-query'],
    });
    expect(
      (await disabled.availableSkills()).map((skill) => skill.name),
    ).toEqual(['data-metadata']);
    expect(await disabled.visibleTools()).not.toContain('dataQuery');
    const { result, stored } = await disabled.call('getSkill', {
      skillName: 'data-query',
    });
    expect(JSON.parse(result.content as string)).toMatchObject({
      status: 'error',
      content: { message: 'Skill not found' },
    });
    expect(stored?.status).not.toBe('success');
    expect(JSON.parse(result.content as string).content).not.toHaveProperty(
      'skillContent',
    );
    expect((await disabled.call('dataQuery')).result).toMatchObject({
      status: 'error',
      content: 'Tool unavailable.',
    });
    expect(fixture.data.dataQuery).not.toHaveBeenCalled();
  });

  it('enables SPECIFIED skills by allowlist and intersects session restrictions', async () => {
    const fixture = await createFixture();
    await fixture.aiManager.skillsManager.registerSkills({
      name: 'specified',
      scope: 'SPECIFIED',
      description: 'Specified',
      content: 'Private skill instructions',
      tools: ['dataQuery'],
    });
    const selected = await fixture.runtime(undefined, 'analysis', {
      enabledSkills: ['specified', 'specified'],
    });
    expect(
      (await selected.availableSkills()).map((skill) => skill.name),
    ).toEqual(['specified']);
    expect(
      (await selected.call('getSkill', { skillName: 'specified' })).stored,
    ).toMatchObject({
      status: 'success',
      content: { skillContent: 'Private skill instructions' },
    });
    expect(await selected.visibleTools()).toContain('dataQuery');
    const narrowed = await fixture.runtime(
      { skillsVersion: 1, skills: ['data-query'] },
      'analysis',
      { enabledSkills: ['specified'] },
    );
    expect(await narrowed.availableSkills()).toEqual([]);
    const denied = await narrowed.call('getSkill', { skillName: 'specified' });
    expect(JSON.parse(denied.result.content as string)).toMatchObject({
      status: 'error',
    });
    expect(denied.stored?.status).not.toBe('success');
    expect(await narrowed.visibleTools()).not.toContain('dataQuery');
  });

  it.each([
    { enabledSkills: undefined, count: 3 },
    { enabledSkills: null, count: 3 },
    { enabledSkills: [], count: 0 },
  ])(
    'distinguishes inherited skills from explicit none: $enabledSkills',
    async ({ enabledSkills, count }) => {
      const fixture = await createFixture();
      const runtime = await fixture.runtime(undefined, 'analysis', {
        enabledSkills,
      });
      expect(await runtime.availableSkills()).toHaveLength(count);
      const loaded = await runtime.call('getSkill', {
        skillName: 'data-query',
      });
      expect(JSON.parse(loaded.result.content as string)).toMatchObject({
        status: count ? 'success' : 'error',
      });
      if (!count) expect(loaded.stored?.status).not.toBe('success');
    },
  );

  it('statically registers the three GENERAL skills and every mapped tool exactly once', async () => {
    const { aiManager } = await createFixture();
    await new AIEmployeeResources().registerAIResources(aiManager);
    const skills = await aiManager.skillsManager.listSkills({
      scope: 'GENERAL',
    });
    const tools = await aiManager.toolsManager.listTools({});
    for (const [name, names] of Object.entries(skillTools)) {
      const matches = skills.filter((skill) => skill.name === name);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        scope: 'GENERAL',
        tools: names,
        content: expect.any(String),
      });
      expect(matches[0].content.length).toBeGreaterThan(100);
      for (const toolName of names) {
        const entries = tools.filter(
          (tool) => tool.definition.name === toolName,
        );
        expect(entries).toHaveLength(1);
        expect(entries[0].invoke).toBeTypeOf('function');
      }
    }
  });

  it('keeps inactive data and report tools out of model calls and blocks direct execution', async () => {
    const fixture = await createFixture();
    const runtime = await fixture.runtime();
    expect(await runtime.visibleTools()).toContain('getSkill');
    for (const name of gatedTools) {
      expect(runtime.discovered.tools.has(name)).toBe(true);
      expect(await runtime.visibleTools()).not.toContain(name);
      const { result } = await runtime.call(name);
      expect(result).toMatchObject({
        status: 'error',
        content: 'Tool unavailable.',
      });
    }
    expect(runtime.executed).not.toHaveBeenCalled();
    for (const method of Object.values(fixture.data))
      expect(method).not.toHaveBeenCalled();
  });

  it('runs getSkill → metadata → getSkill → query → getSkill → report using production execution and persistence', async () => {
    const fixture = await createFixture();
    const runtime = await fixture.runtime();
    const snapshot = runtime.discovered.tools;
    expect(
      (await runtime.availableSkills()).map((skill) => skill.name),
    ).toEqual(expect.arrayContaining(Object.keys(skillTools)));

    for (const name of Object.keys(skillTools)) {
      const { stored } = await runtime.call('getSkill', { skillName: name });
      expect(stored).toMatchObject({
        status: 'success',
        invokeStatus: 'done',
        content: {
          skillName: name,
          activatedTools: skillTools[name as keyof typeof skillTools],
        },
      });
      expect(await runtime.visibleTools()).toEqual(
        expect.arrayContaining(skillTools[name as keyof typeof skillTools]),
      );
      if (name === 'data-metadata') {
        const { stored: metadata } = await runtime.call(
          'getCollectionMetadata',
          { collection: 'orders' },
        );
        expect(metadata).toMatchObject({
          status: 'success',
          content: {
            name: 'orders',
            fields: { items: [{ name: 'amount', type: 'double' }] },
          },
        });
        expect(await runtime.visibleTools()).not.toContain('dataQuery');
      }
      if (name === 'data-query') {
        const { stored: query } = await runtime.call('dataQuery', {
          collection: 'orders',
          aggregates: [{ function: 'sum', field: 'amount', alias: 'total' }],
        });
        expect(query).toMatchObject({
          status: 'success',
          content: { items: [{ total: 42 }] },
        });
        expect(await runtime.visibleTools()).not.toContain(
          'businessReportGenerator',
        );
      }
    }
    const { stored: report } = await runtime.call('businessReportGenerator', {
      title: 'Order revenue',
      markdown: 'Total revenue is 42. {{chart:1}}',
      charts: [
        {
          options: {
            xAxis: { type: 'category', data: ['Total'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [42] }],
          },
        },
      ],
    });
    expect(report).toMatchObject({
      status: 'success',
      content: {
        success: true,
        chartCount: 1,
        report: {
          title: 'Order revenue',
          markdown: 'Total revenue is 42. {{chart:1}}',
        },
      },
    });
    expect(fixture.data.getCollectionMetadata).toHaveBeenCalledOnce();
    expect(fixture.data.dataQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        aggregates: [{ function: 'sum', field: 'amount', alias: 'total' }],
      }),
    );
    expect(runtime.discovered.tools).toBe(snapshot);
    expect(
      fixture.persistence
        .toolMessagesFor('analysis')
        .filter(
          (item) => item.toolName === 'getSkill' && item.status === 'success',
        ),
    ).toHaveLength(3);
  });

  it('executes every metadata and query mapping through its registered schema and actor-bound service', async () => {
    const fixture = await createFixture();
    const runtime = await fixture.runtime();
    await runtime.call('getSkill', { skillName: 'data-metadata' });
    await runtime.call('getSkill', { skillName: 'data-query' });
    const calls = [
      ['getDataSources', {}],
      ['getCollectionNames', { dataSource: 'main' }],
      ['getCollectionMetadata', { collection: 'orders' }],
      ['searchFieldMetadata', { collection: 'orders', query: 'amount' }],
      [
        'dataSourceQuery',
        { collection: 'orders', fields: ['amount'], limit: 10 },
      ],
      ['dataSourceCounting', { collection: 'orders' }],
      [
        'dataQuery',
        {
          collection: 'orders',
          aggregates: [{ function: 'sum', field: 'amount', alias: 'total' }],
        },
      ],
    ] as const;
    for (const [name, args] of calls) {
      expect((await runtime.call(name, args)).stored).toMatchObject({
        status: 'success',
        invokeStatus: 'done',
      });
      expect(fixture.data[name]).toHaveBeenCalledOnce();
      expect(fixture.data[name]).toHaveBeenCalledWith(args);
    }
  });

  it('rejects model-supplied identity and raw SQL before invoking data services', async () => {
    const fixture = await createFixture();
    const runtime = await fixture.runtime();
    await runtime.call('getSkill', { skillName: 'data-query' });
    for (const extra of [
      { actor: { id: 'root', isRoot: true } },
      { sql: 'SELECT * FROM orders' },
    ]) {
      const { result, stored } = await runtime.call('dataSourceQuery', {
        collection: 'orders',
        fields: ['amount'],
        ...extra,
      });
      expect(result.status).toBe('error');
      expect(stored?.status).toBe('error');
    }
    expect(fixture.data.dataSourceQuery).not.toHaveBeenCalled();
  });

  it('does not activate tools for an unsuccessful getSkill call or another session', async () => {
    const fixture = await createFixture();
    const runtime = await fixture.runtime();
    const { result, stored } = await runtime.call('getSkill', {
      skillName: 'not-a-skill',
    });
    expect(JSON.parse(result.content as string)).toMatchObject({
      status: 'error',
      content: { message: 'Skill not found' },
    });
    expect(stored?.status).not.toBe('success');
    expect(await runtime.visibleTools()).not.toContain('dataQuery');
    await runtime.call('getSkill', { skillName: 'data-query' });
    expect(await runtime.visibleTools()).toContain('dataQuery');
    const other = await fixture.runtime(undefined, 'other-session');
    expect(await other.visibleTools()).not.toContain('dataQuery');
    expect((await other.call('dataQuery')).result).toMatchObject({
      status: 'error',
      content: 'Tool unavailable.',
    });
    expect(fixture.data.dataQuery).not.toHaveBeenCalled();
  });

  it.each([
    ['skills', { skillsVersion: 1, skills: [] }],
    ['tools', { toolsVersion: 1, tools: [] }],
  ] as const)(
    'does not let persisted activation bypass session-disabled %s',
    async (_kind, settings) => {
      const fixture = await createFixture();
      const first = await fixture.runtime();
      for (const name of Object.keys(skillTools))
        await first.call('getSkill', { skillName: name });
      expect(await first.visibleTools()).toEqual(
        expect.arrayContaining(gatedTools),
      );
      const disabled = await fixture.runtime(
        settings as AIEmployeeSkillSettings,
      );
      for (const name of gatedTools) {
        expect(await disabled.visibleTools()).not.toContain(name);
        expect((await disabled.call(name)).result).toMatchObject({
          status: 'error',
          content: 'Tool unavailable.',
        });
      }
      expect(disabled.executed).not.toHaveBeenCalled();
      for (const method of Object.values(fixture.data))
        expect(method).not.toHaveBeenCalled();
    },
  );
});

it('runs the activated query/report chain against a real database and real user authorization', async () => {
  const { database, destroy } = await createTestDatabase();
  try {
    const authRoot = dirname(
      createRequire(import.meta.url).resolve(
        '@nocobase/app-plugin-authorization/package.json',
      ),
    );
    await database
      .createMigrator({
        directory: join(authRoot, 'database/migrations'),
        packageName: '@nocobase/app-plugin-authorization',
      })
      .latest();
    await database.builder().createCollection('orders', (collection) => {
      collection.string('id').primary();
      collection.string('ownerId');
      collection.integer('amount');
    });
    await database.repository('orders').createOne({
      values: { id: 'mine', ownerId: 'fixture-user', amount: 42 },
    });
    await database.repository('orders').createOne({
      values: { id: 'theirs', ownerId: 'other-user', amount: 900 },
    });
    const authorization = createAppAuthorization({
      connection: database.connection(),
      database,
    });
    authorization.database.collections.add({
      title: 'Collection',
      name: 'main.orders',
      actions: ['read'],
    });
    await authorization.permissionSets.create({
      key: 'own-orders',
      grants: [
        grant('main.orders', {
          read: {
            fields: ['id', 'amount'],
            recordAccess: ['recordsIOwn'],
          },
        }),
      ],
    });
    await authorization.permissionSets.assign({
      permissionSet: 'own-orders',
      subject: { type: 'user', id: 'fixture-user' },
    });
    const data = createDataServices({
      database,
      authorization,
      actor: { id: 'fixture-user', roles: [], isRoot: false },
    });
    const fixture = await createFixture(data);
    const runtime = await fixture.runtime();
    await runtime.call('getSkill', { skillName: 'data-metadata' });
    expect((await runtime.call('getDataSources')).stored).toMatchObject({
      status: 'success',
      content: { items: [{ name: 'main' }] },
    });
    await runtime.call('getSkill', { skillName: 'data-query' });
    const query = await runtime.call('dataQuery', {
      collection: 'orders',
      aggregates: [{ function: 'sum', field: 'amount', alias: 'total' }],
    });
    expect(query.stored).toMatchObject({
      status: 'success',
      content: { items: [{ total: '42' }] },
    });
    const total = (query.stored?.content as { items: { total: string }[] })
      .items[0].total;
    await runtime.call('getSkill', { skillName: 'business-analysis-report' });
    const report = await runtime.call('businessReportGenerator', {
      title: 'My orders',
      markdown: `Authorized total: ${total}. {{chart:1}}`,
      charts: [
        {
          options: {
            series: [
              {
                type: 'pie',
                data: [{ name: 'Authorized amount', value: total }],
              },
            ],
          },
        },
      ],
    });
    expect(report.stored).toMatchObject({
      status: 'success',
      content: {
        success: true,
        chartCount: 1,
        report: { markdown: 'Authorized total: 42. {{chart:1}}' },
      },
    });
    expect(JSON.stringify(report.stored?.content)).not.toContain('900');
  } finally {
    await destroy();
  }
});
