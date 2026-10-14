// An ACP launcher whose descendant ignores SIGTERM after an explicit readiness handshake.
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const child = spawn(
  process.execPath,
  [
    '-e',
    `
  process.on('SIGTERM', () => {});
  process.send('ready');
  setInterval(() => {}, 1000);
`,
  ],
  { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] },
);
const ready = new Promise((resolve) => child.once('message', resolve));
let text = '';
process.stdin.on('data', async (chunk) => {
  text += chunk;
  const lines = text.split('\n');
  text = lines.pop();
  for (const line of lines) {
    const request = JSON.parse(line);
    if (request.method !== 'initialize') continue;
    await ready;
    writeFileSync(process.env.PROBE_CHILD_PID, String(child.pid));
    process.stdout.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: 1,
          agentCapabilities: {},
          agentInfo: { name: 'test', version: '1.0.0' },
        },
      }) + '\n',
      () => {
        if (process.env.PROBE_PARENT_EARLY_EXIT) process.exit(0);
      },
    );
  }
});
