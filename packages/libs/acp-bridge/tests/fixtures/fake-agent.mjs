// A scriptable ACP agent for the bridge's tests, run as its own process over standard input and output.
//
// A prompt's text decides what the turn does: `permission` asks for permission and says which option came back,
// `hang` waits until the turn is cancelled, `mcp` says which MCP servers the session was given, and anything else is
// answered "Hello world" in two pieces. `session/load` replays one exchange first.
import { Readable, Writable } from 'node:stream';

import * as acp from '@agentclientprotocol/sdk';

const sessions = new Map();

function options(current) {
  return [
    {
      id: 'mode',
      name: 'Mode',
      category: 'mode',
      type: 'select',
      currentValue: current,
      options: [
        { value: 'ask', name: 'Ask' },
        { value: 'full', name: 'Full access' },
      ],
    },
  ];
}

function open(sessionId, request) {
  const session = { mode: 'ask', mcpServers: request.mcpServers, hang: null };
  sessions.set(sessionId, session);
  return session;
}

const say = (client, sessionId, text, messageId) =>
  client.notify(acp.methods.client.session.update, {
    sessionId,
    update: {
      sessionUpdate: 'agent_message_chunk',
      messageId,
      content: { type: 'text', text },
    },
  });

acp
  .agent({ name: 'fake-agent' })
  .onRequest('initialize', () => ({
    protocolVersion: acp.PROTOCOL_VERSION,
    agentCapabilities: { loadSession: true, mcpCapabilities: { http: true } },
    agentInfo: { name: 'fake-agent', title: 'Fake', version: '1.2.3' },
  }))
  .onRequest('session/new', ({ params }) => {
    const sessionId = `s-${sessions.size + 1}`;
    open(sessionId, params);
    return { sessionId, configOptions: options('ask') };
  })
  .onRequest('session/load', async ({ params, client }) => {
    open(params.sessionId, params);
    await client.notify(acp.methods.client.session.update, {
      sessionId: params.sessionId,
      update: {
        sessionUpdate: 'user_message_chunk',
        content: { type: 'text', text: 'earlier question' },
      },
    });
    await say(client, params.sessionId, 'earlier answer', 'old');
    return { configOptions: options('ask') };
  })
  .onRequest('session/set_config_option', ({ params }) => {
    const session = sessions.get(params.sessionId);
    session.mode = params.value;
    return { configOptions: options(session.mode) };
  })
  .onRequest('session/prompt', async ({ params, client }) => {
    const session = sessions.get(params.sessionId);
    const text =
      params.prompt.find((block) => block.type === 'text')?.text ?? '';
    if (text === 'permission') {
      const answer = await client.request(
        acp.methods.client.session.requestPermission,
        {
          sessionId: params.sessionId,
          toolCall: {
            toolCallId: 'call-1',
            title: 'Run rm',
            rawInput: { command: 'rm -rf build' },
          },
          options: [
            { optionId: 'yes', name: 'Allow once', kind: 'allow_once' },
            { optionId: 'no', name: 'Reject', kind: 'reject_once' },
          ],
        },
      );
      const chosen =
        answer.outcome.outcome === 'selected'
          ? answer.outcome.optionId
          : 'cancelled';
      await say(
        client,
        params.sessionId,
        `permission: ${chosen}`,
        'm-permission',
      );
      return { stopReason: 'end_turn' };
    }
    if (text === 'hang') {
      await new Promise((resolve) => (session.hang = resolve));
      return { stopReason: 'cancelled' };
    }
    if (text === 'mcp') {
      await say(
        client,
        params.sessionId,
        JSON.stringify(session.mcpServers),
        'm-mcp',
      );
      return { stopReason: 'end_turn' };
    }
    await say(client, params.sessionId, `Hello (${session.mode})`, 'm-1');
    await say(client, params.sessionId, ' world', 'm-1');
    return {
      stopReason: 'end_turn',
      usage: {
        inputTokens: 10,
        outputTokens: 2,
        totalTokens: 12,
        cachedReadTokens: 5,
      },
    };
  })
  .onNotification('session/cancel', ({ params }) =>
    sessions.get(params.sessionId)?.hang?.(),
  )
  .connect(
    acp.ndJsonStream(
      Writable.toWeb(process.stdout),
      Readable.toWeb(process.stdin),
    ),
  );
