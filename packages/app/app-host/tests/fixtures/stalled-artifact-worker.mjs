import { writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , mode, , destination] = process.argv;
if (mode === 'extract')
  writeFileSync(path.join(destination, 'partial'), 'partial');
// Exercise escalation: a stuck worker may not respond to graceful termination.
process.on('SIGTERM', () => {});
process.once('disconnect', () => process.exit(1));
setInterval(() => {}, 1_000);
process.send({ ready: true });
