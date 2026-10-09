#!/usr/bin/env node
// Model-free CLI protocol peer: exercises the actual SDK's stdin and control responses.
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';

const sessionId = '00000000-0000-4000-8000-000000000001';
const send = (frame) =>
  process.stdout.write(
    JSON.stringify({ uuid: randomUUID(), session_id: sessionId, ...frame }) +
      '\n',
  );
const state = (value) =>
  send({ type: 'system', subtype: 'session_state_changed', state: value });
const tasks = (ids) =>
  send({
    type: 'system',
    subtype: 'background_tasks_changed',
    tasks: ids.map((task_id) => ({
      task_id,
      task_type: 'local_bash',
      description: 'background test',
    })),
  });
const result = (text) =>
  send({
    type: 'result',
    subtype: 'success',
    is_error: false,
    result: text,
    num_turns: 1,
    duration_ms: 1,
    duration_api_ms: 1,
    total_cost_usd: 0,
    usage: {},
    modelUsage: {},
    permission_denials: [],
    queued_turn_count: 0,
  });
const pending = new Map();
let hookId;
let inputClosed = false;
let initialPrompt;

function request(request) {
  if (inputClosed) return Promise.reject(new Error('Stream closed'));
  const request_id = randomUUID();
  return new Promise((resolve, reject) => {
    pending.set(request_id, { resolve, reject });
    send({ type: 'control_request', request_id, request });
  });
}

async function callTool(id, command) {
  const input = { command };
  send({
    type: 'assistant',
    parent_tool_use_id: null,
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id, name: 'Bash', input }],
      usage: {},
    },
  });
  let output;
  let is_error;
  try {
    const hook = await request({
      subtype: 'hook_callback',
      callback_id: hookId,
      tool_use_id: id,
      input: {
        hook_event_name: 'PreToolUse',
        tool_name: 'Bash',
        tool_input: input,
        tool_use_id: id,
        session_id: sessionId,
        transcript_path: '/dev/null',
        cwd: process.cwd(),
      },
    });
    if (hook.hookSpecificOutput?.permissionDecision === 'deny') {
      output = hook.hookSpecificOutput.permissionDecisionReason;
      is_error = true;
    } else {
      const permission = await request({
        subtype: 'can_use_tool',
        tool_name: 'Bash',
        input,
        tool_use_id: id,
      });
      output = permission.behavior === 'allow' ? 'ok' : permission.message;
      is_error = permission.behavior !== 'allow';
    }
  } catch {
    output =
      "The user doesn't want to take this action right now. STOP what you are doing and wait for the user to tell you how to proceed.";
    is_error = true;
  }
  send({
    type: 'user',
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: id, content: output, is_error },
      ],
    },
  });
}

async function run() {
  send({
    type: 'system',
    subtype: 'init',
    model: 'test',
    claude_code_version: '2.1.284',
    permissionMode: 'acceptEdits',
    tools: ['Bash'],
    cwd: process.cwd(),
  });
  state('running');
  await callTool('before-result', 'git status');
  if (initialPrompt.message.content === 'plain') {
    result('plain turn finished');
    state('idle');
    await finish();
    return;
  }
  tasks(['background']);
  result('waiting for background task');
  state('idle');
  // EOF is a permanent loss of bidirectional permissions even while stdout still produces turns.
  await new Promise((resolve) => setTimeout(resolve, 30));
  tasks([]);
  state('running');
  await callTool('after-result-denied', 'cat ../outside.log');
  await callTool('after-result-allowed', 'git status');
  result('continued after background task');
  state('idle');
  await finish();
}

async function finish() {
  const timeout = setTimeout(() => process.exit(3), 3000);
  if (!inputClosed)
    await new Promise((resolve) => lines.once('close', resolve));
  clearTimeout(timeout);
  process.exit(0);
}

const lines = createInterface({ input: process.stdin });
lines.on('line', (line) => {
  const frame = JSON.parse(line);
  if (
    frame.type === 'control_request' &&
    frame.request.subtype === 'initialize'
  ) {
    hookId = frame.request.hooks.PreToolUse[0].hookCallbackIds[0];
    send({
      type: 'control_response',
      response: {
        subtype: 'success',
        request_id: frame.request_id,
        response: {
          commands: [],
          models: [],
          account: {},
          output_style: 'default',
        },
      },
    });
  } else if (frame.type === 'control_response') {
    const entry = pending.get(frame.response.request_id);
    pending.delete(frame.response.request_id);
    if (frame.response.subtype === 'success')
      entry?.resolve(frame.response.response);
    else entry?.reject(new Error(frame.response.error));
  } else if (frame.type === 'user' && !initialPrompt) {
    initialPrompt = frame;
    void run();
  }
});
lines.on('close', () => {
  inputClosed = true;
  for (const entry of pending.values())
    entry.reject(new Error('Stream closed'));
  pending.clear();
});
