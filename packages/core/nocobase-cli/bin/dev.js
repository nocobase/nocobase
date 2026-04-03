#!/usr/bin/env -S node --loader ts-node/esm --disable-warning=ExperimentalWarning

void (async () => {
  const oclif = await import('@oclif/core');
  await oclif.execute({ development: true, dir: __dirname });
})();
