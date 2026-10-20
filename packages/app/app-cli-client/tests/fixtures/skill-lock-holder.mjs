import { randomUUID } from 'node:crypto';
import { mkdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const file = process.argv[2];
await mkdir(file, { recursive: true });
const marker = path.join(file, `owner-${randomUUID()}.json`);
await writeFile(
  marker,
  JSON.stringify({
    pid: process.pid,
    hostname: os.hostname(),
    startedAt: new Date().toISOString(),
  }),
);
process.send('held');
process.once('message', async () => {
  await unlink(marker);
  await rmdir(file);
  process.disconnect();
});
