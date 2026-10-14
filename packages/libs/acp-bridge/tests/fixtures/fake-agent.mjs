// A scriptable ACP agent for the bridge's tests, run as its own process over standard input and output.
//
// A prompt's text decides what the turn does: `permission` asks for permission and says which option came back
// (`permission always` also offers to allow always),
// `hang` waits until the turn is cancelled, `mcp` says which MCP servers the session was given, and anything else is
// answered "Hello world" in two pieces. `session/load` replays one exchange first.
import { Readable, Writable } from 'node:stream';
import { existsSync, writeFileSync } from 'node:fs';

import * as acp from '@agentclientprotocol/sdk';

const sessions = new Map();
if (process.env.FAKE_START_DELAY_MS) {
  Atomics.wait(
    new Int32Array(new SharedArrayBuffer(4)),
    0,
    0,
    Number(process.env.FAKE_START_DELAY_MS),
  );
}
if (process.env.FAKE_HANG_INITIALIZE) {
  process.on('SIGTERM', () => {});
  writeFileSync(process.env.FAKE_PID_FILE, String(process.pid));
}
const authStage = process.env.FAKE_AUTH_STAGE;
const signedIn =
  !process.env.FAKE_AUTH_MARKER || existsSync(process.env.FAKE_AUTH_MARKER);
function checkAuth(stage) {
  if (authStage === stage && !signedIn) throw acp.RequestError.authRequired();
}

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
  .onRequest('initialize', async () => {
    if (process.env.FAKE_HANG_INITIALIZE) await new Promise(() => {});
    return {
      protocolVersion: acp.PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: true,
        mcpCapabilities: { http: true },
        ...(authStage === 'resume'
          ? { sessionCapabilities: { resume: {} } }
          : {}),
      },
      agentInfo: { name: 'fake-agent', title: 'Fake', version: '1.2.3' },
    };
  })
  .onRequest('session/new', ({ params }) => {
    checkAuth('new');
    const sessionId = `s-${sessions.size + 1}`;
    open(sessionId, params);
    return { sessionId, configOptions: options('ask') };
  })
  .onRequest('session/load', async ({ params, client }) => {
    checkAuth('load');
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
  .onRequest('session/resume', ({ params }) => {
    checkAuth('resume');
    open(params.sessionId, params);
    return { configOptions: options('ask') };
  })
  .onRequest('session/set_config_option', ({ params }) => {
    const session = sessions.get(params.sessionId);
    session.mode = params.value;
    return { configOptions: options(session.mode) };
  })
  .onRequest('session/prompt', async ({ params, client }) => {
    checkAuth('prompt');
    const session = sessions.get(params.sessionId);
    const text =
      params.prompt.find((block) => block.type === 'text')?.text ?? '';
    if (text === 'permission' || text === 'permission always') {
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
            ...(text === 'permission always'
              ? [
                  {
                    optionId: 'always',
                    name: 'Allow always',
                    kind: 'allow_always',
                  },
                ]
              : []),
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
