#!/usr/bin/env node

void (async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ dir: __dirname });
})();
