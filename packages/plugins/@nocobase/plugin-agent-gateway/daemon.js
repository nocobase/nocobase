#!/usr/bin/env node

require('./dist/daemon/cli')
  .runCli(process.argv)
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
