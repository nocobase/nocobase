// A JSON-RPC fixture, not a real coding tool. Records only synthetic test inputs.
import readline from 'node:readline';
import { appendFileSync, writeFileSync } from 'node:fs';
const send = (value) =>
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...value }) + '\n');
const update = (text) =>
  send({
    method: 'session/update',
    params: {
      sessionId: 'fixture-session',
      update: {
        sessionUpdate: 'agent_message_chunk',
        content: { type: 'text', text },
      },
    },
  });
const variant = process.env.ACP_FIXTURE_VARIANT;
let pending;
let openingId;
let model = 'one';
const config = () => [
  {
    id: 'model-option',
    category: 'model',
    type: 'select',
    name: 'Model',
    currentValue: model,
    options: [
      {
        group: 'models',
        name: 'Models',
        options: [
          { value: 'one', name: 'Model One' },
          { value: 'two', name: 'Model Two' },
        ],
      },
    ],
  },
];
readline.createInterface({ input: process.stdin }).on('line', async (line) => {
  const message = JSON.parse(line);
  if (process.env.ACP_FIXTURE_TRACE)
    appendFileSync(
      process.env.ACP_FIXTURE_TRACE,
      JSON.stringify(message) + '\n',
    );
  const { id, method, params } = message;
  if (id === 'permission-1' && message.result) {
    send({
      id: openingId,
      result: { sessionId: 'fixture-session', configOptions: config() },
    });
    return;
  }
  const result = (value) => send({ id, result: value });
  const error = (code) =>
    send({ id, error: { code, message: 'Fixture error' } });
  if (method === 'initialize') {
    if (process.env.ACP_FIXTURE_TRACE)
      appendFileSync(
        process.env.ACP_FIXTURE_TRACE,
        JSON.stringify({
          method: 'permissionEnv',
          params: {
            value: process.env.ACP_FIXTURE_PERMISSION_DEFAULT ?? 'off',
          },
        }) + '\n',
      );
    if (process.env.ACP_FIXTURE_PID)
      writeFileSync(process.env.ACP_FIXTURE_PID, String(process.pid));
    if (variant === 'initializeAuth') return error(-32000);
    return result({
      protocolVersion: 1,
      agentInfo: { name: 'fixture', version: '1.2.3' },
      agentCapabilities:
        variant === 'resume'
          ? { sessionCapabilities: { resume: {} } }
          : { loadSession: true },
      authMethods: [{ id: 'native', name: 'Native login' }],
    });
  }
  if (
    method === 'session/new' ||
    method === 'session/load' ||
    method === 'session/resume'
  ) {
    if (variant === 'auth') return error(-32000);
    if (variant === 'sessionMissing' && method !== 'session/new')
      return error(-32002);
    if (variant === 'network' && method !== 'session/new') return error(-32603);
    if (method === 'session/load') update('REPLAY MUST NOT APPEAR');
    if (variant === 'permission') {
      openingId = id;
      send({
        id: 'permission-1',
        method: 'session/request_permission',
        params: {
          sessionId: 'fixture-session',
          toolCall: {
            toolCallId: 't',
            title: 'Write',
            rawInput: { file: 'test' },
          },
          options: [{ optionId: 'allow', name: 'Allow', kind: 'allow_always' }],
        },
      });
      return;
    }
    return result({
      sessionId: 'fixture-session',
      ...(variant === 'unsupported'
        ? {}
        : variant === 'legacy'
          ? {
              models: {
                currentModelId: model,
                availableModels: [
                  { modelId: 'one', name: 'Model One' },
                  { modelId: 'two', name: 'Model Two' },
                ],
              },
            }
          : { configOptions: config() }),
    });
  }
  if (method === 'session/set_config_option') {
    if (variant !== 'misapply') model = params.value;
    return result({ configOptions: config() });
  }
  if (method === 'session/set_model') {
    model = params.modelId;
    return result({});
  }
  if (method === 'session/prompt') {
    if (variant === 'promptAuth') return error(-32000);
    if (variant === 'hang') {
      pending = id;
      update('running');
      return;
    }
    update(`cwd=${process.cwd()} model=${model}`);
    update(params.prompt.map((item) => item.text).join('\n'));
    send({
      method: 'session/update',
      params: {
        sessionId: 'fixture-session',
        update: {
          sessionUpdate: 'tool_call',
          toolCallId: 'tool-1',
          title: 'Read',
          kind: 'read',
          status: 'in_progress',
          rawInput: { path: 'test' },
        },
      },
    });
    send({
      method: 'session/update',
      params: {
        sessionId: 'fixture-session',
        update: {
          sessionUpdate: 'tool_call_update',
          toolCallId: 'tool-1',
          status: 'completed',
          rawOutput: 'read result',
        },
      },
    });
    return result({
      stopReason: 'end_turn',
      ...(variant === 'usage'
        ? { usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 } }
        : {}),
    });
  }
  if (method === 'session/cancel' && pending) {
    send({ id: pending, result: { stopReason: 'cancelled' } });
    pending = undefined;
  }
});
