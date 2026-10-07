// A command_not_found hook that records what oclif hands it, for the dynamic-command spike in cli.test.ts.
import type { Hook } from '@oclif/core';

const seen: { id: string; argv: string[] | undefined }[] = [];
(globalThis as { acmeSpikeSeen?: typeof seen }).acmeSpikeSeen = seen;

const hook: Hook.CommandNotFound = function (options) {
  seen.push({ id: options.id, argv: options.argv });
  return Promise.resolve('handled');
};

export default hook;
