// @vitest-environment node
/**
 * Online agents in Studio: the project manager as an online agent answers a conversation on the server with `nb-studio` in
 * its sandboxed shell (help from the manifest, reading issues and knowledge, a write the conversation's plan rules
 * refuse, a command it is not offered), briefed in the tools dialect; intake with AI drafts through an online agent
 * with no runner; and online agents never execute issues. The model is a scripted fake gateway,
 * over a real model service (`local`) that offers the agents' model.
 */
import type {
  ModelEvent,
  ModelRequest,
  ModelGateway,
  ServerExecutor,
} from '@nocobase/app-plugin-agents/server/tokens';
import {
  createServerExecutor,
  scriptedSteps,
  type ScriptedModels,
} from '@nocobase/app-plugin-agents/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

type Step = (
  request: ModelRequest,
) => AsyncGenerator<ModelEvent, void, undefined>;

const finish = (reason: 'stop' | 'toolCalls' = 'stop'): ModelEvent => ({
  type: 'finish',
  reason,
  model: 'mock-model',
  usage: { inputTokens: 50, outputTokens: 10 },
});

/** A `bash` call running `command`. */
const sh = (command: string): Step =>
  async function* () {
    yield {
      type: 'toolCall',
      call: { id: `sh-${command}`, name: 'bash', args: { command } },
    };
    yield finish('toolCalls');
  };

/** What a `bash` call answered: its exit code and output. */
function shell(content: string): { exit: number; text: string } {
  const [first = '', ...rest] = content.split('\n');
  return {
    exit: Number(first.replace('exit code ', '')),
    text: rest.join('\n'),
  };
}

const say = (text: string): Step =>
  async function* () {
    yield { type: 'text', delta: text };
    yield finish();
  };

const fakePort = (steps: Step[]): ScriptedModels => scriptedSteps(steps);

const PM_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'kb.knowledge/read',
  'kb.knowledge/propose',
];

let h: BridgeHarness;
let projectId: string;
beforeEach(async () => {
  h = await createBridgeHarness({ knowledge: true });
  for (const id of ['alice', 'root']) await h.addUser(id);
  h.roles.set('root', 'admin');
  projectId = (
    await h.projects.projects.create(h.viewer('root'), {
      name: 'Studio',
      leadUserId: 'alice',
    })
  ).id;
});
afterEach(() => h.close());

/** Adds the `local` model service and an executor whose model calls `port` answers. */
async function answerWith(
  port: Pick<ModelGateway, 'languageModel'>,
): Promise<ServerExecutor> {
  await h.agents.online.services.create({
    title: 'Local',
    provider: 'openai-compatible',
    baseUrl: 'http://127.0.0.1:9/v1',
    models: [{ value: 'mock-model', label: 'Mock model' }],
  });
  return createServerExecutor({
    clock: h.agents.clock,
    claims: h.agents.claims,
    reports: h.agents.reports,
    runs: h.agents.runs,
    conversations: h.agents.conversations,
    consultations: h.agents.consultations,
    commands: (identity, token) => h.commandsOf(identity, token),
    skill: (skill) =>
      h.agents.skills.snapshot(skill.slug, skill.hash).then((snapshot) => ({
        ...snapshot,
        name: skill.name,
        description: skill.description,
      })),
    gateway: port,
    signal: h.agents.signal,
  });
}

function chatAgent(
  name = 'PM',
  extra: { readonly confirmChanges?: 'always' } = {},
) {
  return h.agents.agents.create('alice', {
    ...extra,
    name,
    type: 'online',
    modelEntries: [{ modelService: 'local', model: 'mock-model' }],
    actions: PM_ACTIONS,
    access: 'everyone',
  });
}

describe('online agents in Studio', () => {
  it('answers a conversation with nb-studio in its shell, and links the knowledge it read', async () => {
    await h.projects.issues.create(h.viewer('alice'), {
      title: 'Login form validation',
      projectId,
    });
    const doc = await h.knowledge!.docs.create(
      { userId: 'root' },
      {
        scope: 'system',
        scopeId: '',
        title: 'Release process',
        slug: 'release-process',
        summary: 'How we release.',
        content: '# Release process\n\nTag after review.',
      },
    );
    const port = fakePort([
      sh('nb-studio --help'),
      sh('nb-studio issue search --q Login --json'),
      sh('nb-studio kb read release-process --json'),
      sh('nb-studio issue create --title "Fix the login" --json'),
      sh('nb-studio issue comment add PM-1 --content Hi'),
      say('PM-1 is open. See [Release process](/knowledge?doc=x).'),
    ]);
    const executor = await answerWith(port);
    // Set to ask before every change: each direct write needs a plan.
    const agent = await chatAgent('PM', { confirmChanges: 'always' });
    const conversation = await h.agents.conversations.create('alice', {
      agentId: agent.id,
    });
    expect(conversation.mode).toBe('online');
    const sent = await h.agents.conversations.send('alice', conversation.id, {
      content: 'Where is the login work?',
    });
    await executor.drain();

    expect((await h.agents.runs.get(sent.run!.id)).status).toBe('completed');
    const answers = port.requests
      .slice(1)
      .map((request) => shell(String(request.messages.at(-1)!.content)));
    // The brief names the commands of the CLI in its shell, and the two tools are all it gets.
    const system = String(port.requests[0].messages[0].content);
    expect(system).toContain('nb-studio plan create --file /tmp/plan.json');
    expect(system).toContain('`nb-studio issue search`');
    expect(system).toContain('nb-studio kb search');
    expect(system).not.toContain('kb_search');
    expect(port.requests[0].tools!.map((tool) => tool.name)).toEqual(['bash']);
    // Help lists what the person may let it run, from the manifest.
    expect(answers[0]!.exit).toBe(0);
    expect(answers[0]!.text).toContain('issue search');
    expect(answers[0]!.text).toContain('kb read');
    // Reads run as the person who asked.
    const found = JSON.parse(answers[1]!.text) as {
      result: { data: { title: string }[] };
    };
    expect(found.result.data.map((issue) => issue.title)).toContain(
      'Login form validation',
    );
    const read = JSON.parse(answers[2]!.text) as {
      result: { data: { id: string; url: string } };
    };
    expect(read.result.data.id).toBe(doc.id);
    expect(read.result.data.url).toContain(`doc=${doc.id}`);
    // A write that needs the person's confirmation asks for a plan, readably, with the plan exit code.
    expect(answers[3]!.exit).toBe(7);
    expect(JSON.parse(answers[3]!.text)).toMatchObject({
      ok: false,
      error: { code: 'PLAN_REQUIRED' },
    });
    // The agent is not configured to comment: the command is not offered to it, and nothing is sent.
    expect(answers[4]!.exit).toBe(4);
    expect(answers[4]!.text).toContain('There is no command issue comment add');
    const messages = await h.agents.conversations.messages(
      'alice',
      conversation.id,
      {},
    );
    expect(messages.items.at(-1)).toMatchObject({
      role: 'assistant',
      content: {
        content: 'PM-1 is open. See [Release process](/knowledge?doc=x).',
      },
    });
  });

  it('drafts intake with an online agent, without a runner', async () => {
    const port = fakePort([
      sh(
        `printf '%s' '${JSON.stringify({
          drafts: [
            { position: 1, parentPosition: null, title: '登录改版' },
            { position: 2, parentPosition: 1, title: '表单校验' },
          ],
        })}' > /tmp/drafts.json && nb-studio intake drafts --file /tmp/drafts.json`,
      ),
      say('Two drafts handed back.'),
    ]);
    const executor = await answerWith(port);
    // A runner agent is the team's default; the online agent is preferred because it can answer now.
    const work = await h.createAgent({ name: 'Coder' });
    await h.agents.chat.updateSettings('root', { defaultAgentId: work });
    await chatAgent('Planner');
    expect(
      await h.projects.intakeAi.availability(h.viewer('alice')),
    ).toMatchObject({ available: true, by: 'Planner', waits: false });

    const job = await h.projects.intakeAi.start(h.viewer('alice'), {
      mode: 'split',
      text: '# 登录改版\n- 表单校验',
    });
    await executor.drain();

    const system = port.requests[0].messages[0].content;
    expect(system).toContain('`nb-studio intake drafts --file <path>`');
    expect(system).toContain('Write them as JSON to a file under /tmp');
    expect(shell(String(port.requests[1].messages.at(-1)!.content)).exit).toBe(
      0,
    );
    const done = await h.projects.intakeAi.get(h.viewer('alice'), job.id);
    expect(done.status).toBe('done');
  });

  it('lets a consulted agent read and propose a plan the person confirms in the conversation, never write', async () => {
    const plan = JSON.stringify({
      title: 'Track the login bug',
      rows: [
        {
          op: 'issue.create',
          params: { title: 'Fix the login bug', projectId },
        },
      ],
    });
    const port = fakePort([
      async function* () {
        yield {
          type: 'toolCall',
          call: {
            id: 'ask-analyst',
            name: 'ask_agent',
            args: {
              agent: 'Analyst',
              question: 'Is the login bug tracked?',
            },
          },
        };
        yield finish('toolCalls');
      },
      sh('nb-studio issue create --title "Fix the login bug" --json'),
      sh(
        `printf '%s' '${plan}' > /tmp/plan.json && nb-studio plan create --file /tmp/plan.json --json`,
      ),
      say('It is not; I proposed a plan to track it.'),
      say('Analyst proposed a plan; confirm it above.'),
    ]);
    const executor = await answerWith(port);
    const pm = await chatAgent('PM');
    await chatAgent('Analyst');
    const conversation = await h.agents.conversations.create('alice', {
      agentId: pm.id,
    });
    const sent = await h.agents.conversations.send('alice', conversation.id, {
      content: 'Is the login bug tracked?',
    });
    await executor.drain();

    const parent = await h.agents.runs.detail(sent.run!.id);
    expect(parent.status).toBe('completed');
    const [child] = parent.children;
    expect(child).toMatchObject({ agentName: 'Analyst', status: 'completed' });
    // The consulted agent may not write: creating an issue is not even offered to it.
    const [created, proposed] = port.requests
      .slice(2, 4)
      .map((request) => shell(String(request.messages.at(-1)!.content)));
    expect(created!.exit).toBe(4);
    // Its plan belongs to the conversation that asked, for alice to confirm there.
    expect(proposed!.exit).toBe(0);
    expect(JSON.parse(proposed!.text).result.data).toMatchObject({
      title: 'Track the login bug',
      source: { key: `conversation:${conversation.id}` },
    });
    // The asking agent reads the answer and that a plan waits for alice.
    const answer = String(port.requests[4]!.messages.at(-1)!.content);
    expect(answer).toContain('It is not; I proposed a plan to track it.');
    expect(answer).toContain('"Track the login bug"');
    const messages = await h.agents.conversations.messages(
      'alice',
      conversation.id,
      {},
    );
    expect(
      messages.items.find(
        (message) => message.metadata.notice?.code === 'consultation',
      )?.metadata.notice,
    ).toMatchObject({ agentName: 'Analyst', state: 'completed', plans: 1 });
  });

  it('never gives an issue to an online agent', async () => {
    await answerWith(fakePort([say('Hi.')]));
    const agent = await chatAgent();
    await expect(
      h.projects.issues.create(h.viewer('alice'), {
        title: 'Build it',
        projectId,
        executor: { type: 'agent', id: agent.id },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
  });
});
