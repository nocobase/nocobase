import { readSync } from 'node:fs';

// Hold the CLI after its initial output, before it can initialize the watcher.
// The parent changes the log and releases fd 3, without relying on scheduling.
const write = process.stdout.write.bind(process.stdout);
let gated = false;
process.stdout.write = (...args) => {
  const result = write(...args);
  if (!gated && String(args[0]).includes('ready\n')) {
    gated = true;
    readSync(3, Buffer.alloc(1), 0, 1, null);
  }
  return result;
};
