// @vitest-environment node
import { randomBytes } from 'node:crypto';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import type { AppUIMessage } from '@nocobase/app-plugin-agents/shared/online-agent';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.ts';
import {
  EXAMPLES_FORM_SCOPE,
  EXAMPLES_FORM_TOOL,
  formProposalSchema,
  formProposalValuesSchema,
  type FormProposal,
} from '../../shared/ai-form-fill.ts';
import { createOnlineAgentModelFixture } from '../fixtures/online-agent-model.ts';

const proposal: FormProposal = {
  formId: 'examples-request',
  instance: 'browser-instance-1',
  identity: 'request-A',
  revision: '0',
  values: {
    name: 'Fixture request',
    department: 'design',
    quantity: 3,
    budget: 0,
    arrival: '2026-11-06',
    purpose: 'Design and prototyping',
  },
};

it('validates the application proposal without accepting undeclared or read-only fields', () => {
  expect(formProposalSchema.parse(proposal)).toEqual(proposal);
  for (const values of [
    {},
    { recordId: 'read-only' },
    { name: '' },
    { name: 'x'.repeat(121) },
    { priority: 'urgent' },
    { budget: -1 },
    { budget: 1_000_001 },
    { budget: NaN },
    { budget: Infinity },
    { subscribe: 'true' },
    { department: 'unknown' },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 10_001 },
    { arrival: '2026-02-30' },
    { purpose: 'x'.repeat(2001) },
    JSON.parse('{"__proto__":{"polluted":true}}'),
    { constructor: 'unsafe' },
  ]) {
    expect(formProposalValuesSchema.safeParse(values).success).toBe(false);
  }
  for (const key of ['formId', 'instance', 'identity', 'revision']) {
    expect(
      formProposalSchema.safeParse({ ...proposal, [key]: '' }).success,
    ).toBe(false);
  }
  expect(
    formProposalSchema.safeParse({ ...proposal, saved: true }).success,
  ).toBe(false);
});

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  install: true,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: randomBytes(32).toString('hex'),
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { enabled: true, disableSignUp: false },
    },
    secrets: { keys: [{ version: 1, key: randomBytes(32).toString('hex') }] },
    agents: { vectors: { store: false } },
  },
});
const write = (data: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(data),
});

// Real application composition, real HTTP model, real SDK tool execution and durable public history.
test('delivers selected UI data to the model and persists a safe, completed draft proposal', async ({
  testApp,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const fixture = await createOnlineAgentModelFixture({ scene: 'form' });
  try {
    const configured = await admin.fetch(
      '/agents/services',
      write({
        title: 'Form proposal local model',
        provider: 'openai-compatible',
        baseUrl: fixture.url,
        apiKey: 'local-fixture-only',
        enabled: true,
        models: [{ value: 'fixture-chat', kind: 'chat' }],
      }),
    );
    expect(configured.status).toBe(201);
    const serviceName: string = (await configured.json()).data.name;
    const ordinary = await admin.fetch(
      '/agents/conversations',
      write({ agentId: 'online' }),
    );
    expect(ordinary.status).toBe(201);
    const ordinaryId: string = (await ordinary.json()).data.id;
    expect(
      await (
        await admin.fetch(`/agents/conversations/${ordinaryId}/config`)
      ).json(),
    ).toMatchObject({ data: { tool: [], scope: [] } });
    const created = await admin.fetch(
      '/agents/conversations',
      write({
        agentId: 'online',
        config: { scope: [EXAMPLES_FORM_SCOPE] },
        selectedModel: { modelService: serviceName, model: 'fixture-chat' },
      }),
    );
    expect(created.status).toBe(201);
    const conversation: ConversationDetail = (await created.json()).data;
    const endpoint = `/agents/conversations/${conversation.id}`;
    const detail = async (): Promise<ConversationDetail> =>
      (await (await admin.fetch(endpoint)).json()).data;
    const history = async (): Promise<AppUIMessage[]> =>
      (await (await admin.fetch(`${endpoint}/messages?after=0`)).json()).data;
    const config = await admin.fetch(`${endpoint}/config`);
    expect(await config.json()).toMatchObject({
      data: {
        scope: [EXAMPLES_FORM_SCOPE],
        tool: [EXAMPLES_FORM_TOOL],
      },
    });
    const item = {
      kind: 'form',
      id: proposal.formId,
      instance: proposal.instance,
      identity: proposal.identity,
      revision: proposal.revision,
      values: {
        name: 'Current browser draft',
        department: 'design',
        quantity: 1,
        budget: 0,
      },
      fields: [
        { name: 'name', type: 'string', editable: true },
        {
          name: 'department',
          type: 'string',
          editable: true,
          enum: ['design', 'engineering', 'marketing', 'admin'],
        },
        { name: 'quantity', type: 'number', editable: true },
        { name: 'budget', type: 'number', editable: true },
        { name: 'arrival', type: 'string', editable: true },
        { name: 'purpose', type: 'string', editable: true },
      ],
      applicationExtension: {
        nested: [false, 0, '', null, { custom: 'kept' }],
      },
    };
    const context = {
      route: '/ai-form-fill',
      items: [],
      ui: { version: 1, items: [item] },
    };
    const sent = await admin.fetch(
      `${endpoint}/messages`,
      write({
        message: {
          id: 'form-source',
          role: 'user',
          parts: [{ type: 'text', text: 'Propose a high priority request.' }],
        },
        context,
      }),
    );
    expect(sent.status).toBe(200);
    const streamed = sent.text();
    await expect.poll(() => fixture.streams.length).toBe(1);
    const modelRequest = fixture.requests.find((request) => request.stream)!;
    expect(modelRequest.tools?.map((tool) => tool.function.name)).toEqual([
      EXAMPLES_FORM_TOOL,
    ]);
    const modelInput = JSON.stringify(modelRequest.messages);
    expect(modelInput).toContain('Current browser draft');
    expect(modelInput).toContain('browser-instance-1');
    expect(modelInput).toContain('applicationExtension');
    expect(modelInput).toContain('kept');
    // The real provider completes immediately: local browser application is not SDK approval/continuation.
    fixture.formProposal(0, proposal);
    await expect.poll(() => fixture.streams.length).toBe(2);
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Fixture request',
    );
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      EXAMPLES_FORM_TOOL,
    );
    fixture.append(1, 'Review this proposal; nothing has been saved.');
    fixture.complete(1);
    const stream = await streamed;
    expect(stream).toContain('tool-output-available');
    expect(stream).not.toContain('tool-approval-request');
    expect(stream).toContain('browser-instance-1');
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    const saved = await history();
    const source = saved.find((message) => message.role === 'user')!;
    const assistant = saved.find((message) => message.role === 'assistant')!;
    expect(source.metadata?.context?.ui).toEqual(context.ui);
    expect(assistant.metadata?.turnId).toBe(source.metadata?.turnId);
    expect(assistant.metadata?.sourceUserMessageId).toBe(source.id);
    expect(source.metadata?.turnId).toBeTruthy();
    expect(assistant.parts).toContainEqual(
      expect.objectContaining({
        type: `tool-${EXAMPLES_FORM_TOOL}`,
        toolCallId: 'form-proposal',
        state: 'output-available',
        input: proposal,
        output: proposal,
      }),
    );
    expect(JSON.stringify(saved)).not.toContain('local-fixture-only');
    expect(saved.every((message) => !('original' in message))).toBe(true);
    // Reading durable history and reconnecting cannot execute the proposal or start another model turn.
    expect(await history()).toEqual(saved);
    expect((await admin.fetch(`${endpoint}/events`)).status).toBe(204);
    expect(fixture.streams).toHaveLength(2);
    expect((await detail()).execution?.waitingApproval).not.toBe(true);

    // The model cannot bypass the business schema; invalid tool arguments never become an applicable public card.
    const invalid = await admin.fetch(
      `${endpoint}/messages`,
      write({
        message: {
          id: 'invalid-proposal-source',
          role: 'user',
          parts: [{ type: 'text', text: 'Try an invalid negative budget.' }],
        },
        context,
      }),
    );
    expect(invalid.status).toBe(200);
    const invalidStream = invalid.text();
    await expect.poll(() => fixture.streams.length).toBe(3);
    fixture.formProposal(
      2,
      { ...proposal, values: { budget: -1 } },
      'invalid-form',
    );
    await expect.poll(() => fixture.streams.length).toBe(4);
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'invalid-form',
    );
    expect(JSON.stringify(fixture.requests.at(-1)?.messages)).toContain(
      'Invalid input for tool examples_form_proposal',
    );
    fixture.append(3, 'The invalid proposal was not accepted.');
    fixture.complete(3);
    expect(await invalidStream).not.toContain('tool-output-available');
    await expect
      .poll(async () => (await detail()).execution?.status)
      .toBe('idle');
    const afterInvalid = await history();
    expect(
      afterInvalid.filter((message) => message.role === 'user'),
    ).toHaveLength(2);
    expect(afterInvalid.at(-1)?.parts).not.toContainEqual(
      expect.objectContaining({ toolCallId: 'invalid-form' }),
    );
  } finally {
    await fixture.close();
  }
});
