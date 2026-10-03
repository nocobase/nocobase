import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ChatResult } from '@langchain/core/outputs';
import { describe, expect, it, vi } from 'vitest';
import type { LLMProvider } from '@nocobase/ai-employee';
import getSkill from '../server/ai/tools/getSkill.js';
import { agentServiceFactoryToken } from '../server/agent/service/agent-service-factory.js';
import { createTestAIEmployeeFixture } from './app/test-context.js';
import { MemoryConversationPersistence } from './memory-conversation-persistence.js';

/** Answers each call with the next scripted message and records what it saw. */
class ScriptedChatModel extends BaseChatModel {
  public readonly seen: BaseMessage[][] = [];
  public readonly boundTools: string[][] = [];

  public constructor(private readonly script: AIMessage[]) {
    super({});
  }

  public _llmType(): string {
    return 'scripted';
  }

  public bindTools(tools: { name?: string }[]): this {
    this.boundTools.push(tools.map((tool) => String(tool.name)));
    return this;
  }

  public async _generate(messages: BaseMessage[]): Promise<ChatResult> {
    this.seen.push(messages);
    const message = this.script.shift();
    if (!message) throw new Error('The script has no response left');
    return { generations: [{ message, text: String(message.content) }] };
  }
}

async function fixedAgent(
  options: { skills?: string[] },
  requestedSkill = 'order-intake',
) {
  const fixture = await createTestAIEmployeeFixture();
  await fixture.deps.ai.toolsManager.registerTools(getSkill);
  await fixture.deps.ai.skillsManager.registerSkills({
    scope: 'SPECIFIED',
    name: 'order-intake',
    description: 'Record a new order once it is confirmed.',
    content: '# Order intake\n\nConfirm the quantity before creating anything.',
    tools: [],
  });
  // Registered for everyone, yet not given to this agent.
  await fixture.deps.ai.skillsManager.registerSkills({
    scope: 'GENERAL',
    name: 'refunds',
    description: 'Refund an order.',
    content: '# Refunds\n\nRefund the full amount without asking.',
    tools: [],
  });
  const model = new ScriptedChatModel([
    new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call-1',
          name: 'getSkill',
          args: { skillName: requestedSkill },
        },
      ],
    }),
    new AIMessage('Loaded'),
  ]);
  const provider = {
    createModel: () => model,
    resolveTools: (tools: unknown[]) => tools,
    prepareStoredAssistantAdditionalKwargs: (
      additionalKwargs?: Record<string, unknown>,
    ) => additionalKwargs,
  } as unknown as LLMProvider;
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'resolveModel',
  ).mockResolvedValue({ llmService: 'test-service', model: 'test-model' });
  vi.spyOn(
    fixture.deps.ai.llmProviderManager,
    'getLLMService',
  ).mockResolvedValue({
    provider,
    model: 'test-model',
    service: { name: 'test-service', provider: 'test' },
  } as never);
  const persistence = new MemoryConversationPersistence('fixed-skills');
  const agent = await fixture.container
    .resolve(agentServiceFactoryToken)
    .createAgent({
      sessionId: 'fixed-skills',
      persistence,
      actor: { id: 1, roles: [], isRoot: false },
      runtime: { logger: fixture.deps.logging.getLogger('ai-employee-test') },
      systemPrompt: 'You record orders.',
      ...options,
    });
  return { agent, model, persistence };
}

const question = [
  { role: 'user' as const, content: { type: 'text', content: 'New order' } },
];

describe('createAgent() skills', () => {
  it('lets the model load a Skill it was given, through getSkill', async () => {
    const { agent, model, persistence } = await fixedAgent({
      skills: ['order-intake'],
    });

    await agent.invoke({ userMessages: question });

    expect(model.boundTools[0]).toContain('getSkill');
    const system = JSON.stringify(model.seen[0]?.[0]?.content);
    expect(system).toContain('You record orders.');
    expect(system).toContain('**order-intake**');
    const [toolMessage] = persistence
      .messagesFor('fixed-skills')
      .filter((message) => message.role === 'tool');
    expect(JSON.stringify(toolMessage?.content)).toContain(
      'Confirm the quantity before creating anything.',
    );
  });

  it('cannot load a registered Skill it was not given', async () => {
    const { agent, model, persistence } = await fixedAgent(
      { skills: ['order-intake'] },
      'refunds',
    );

    await agent.invoke({ userMessages: question });

    const system = JSON.stringify(model.seen[0]?.[0]?.content);
    expect(system).not.toContain('**refunds**');
    const [toolMessage] = persistence
      .messagesFor('fixed-skills')
      .filter((message) => message.role === 'tool');
    const loaded = JSON.stringify(toolMessage?.content);
    expect(loaded).toContain('Skill not found');
    expect(loaded).not.toContain('Refund the full amount');
  });

  it('drops a Skill name that is not registered, without failing', async () => {
    const { agent, model } = await fixedAgent({
      skills: ['order-intake', 'order-intak'],
    });

    await agent.invoke({ userMessages: question });

    const system = JSON.stringify(model.seen[0]?.[0]?.content);
    expect(system).toContain('**order-intake**');
    expect(system).not.toContain('order-intak**');
  });

  it('adds neither getSkill nor a skills section when given no Skills', async () => {
    const { agent, model } = await fixedAgent({});
    model.seen.length = 0;

    await agent.invoke({ userMessages: question }).catch(() => undefined);

    expect(model.boundTools.flat()).not.toContain('getSkill');
    expect(JSON.stringify(model.seen[0]?.[0]?.content)).not.toContain(
      '<skills>',
    );
  });
});
