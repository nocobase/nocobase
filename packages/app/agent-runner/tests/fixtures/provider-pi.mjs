// A provider with no login: both detection and RPC require the local key.
import { createInterface } from 'node:readline';

const send = (record) => console.log(JSON.stringify(record));
if (process.argv.includes('--version')) {
  console.log('pi 0.99.2');
} else if (process.argv.includes('--list-models')) {
  console.log(
    process.env.LOCAL_PROVIDER_KEY === 'synthetic-key'
      ? 'provider model\ncustom demo'
      : 'No available models',
  );
} else {
  if (process.env.LOCAL_PROVIDER_KEY !== 'synthetic-key') {
    console.error('Provider key missing at runtime');
    process.exit(1);
  }
  const input = createInterface({ input: process.stdin });
  input.on('line', (line) => {
    const command = JSON.parse(line);
    const data =
      command.type === 'get_commands'
        ? { commands: [{ name: 'nocobase-runner-permission' }] }
        : command.type === 'get_state'
          ? { sessionId: 'local-provider-session', isStreaming: false }
          : {};
    send({
      type: 'response',
      command: command.type,
      id: command.id,
      success: true,
      data,
    });
    if (command.type === 'prompt') {
      send({
        type: 'message_end',
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'local provider authenticated' }],
          provider: 'custom',
          model: 'demo',
          usage: { input: 0, output: 1, cost: { total: 0 } },
        },
      });
      send({ type: 'agent_end', messages: [], willRetry: false });
      send({ type: 'agent_settled' });
    }
  });
}
