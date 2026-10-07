// oclif calls this for a command id it does not know: a business command from the server's manifest
// (src/dynamic/), or a mistake. oclif folds positional words into `id` and splits words holding `:`
// (`acme issue comment add PM-1 --x` arrives as id 'issue:comment:add:PM-1' with argv ['--x']), so the command is
// resolved from the original argv instead.
import type { Hook } from '@oclif/core';

import { getOriginalArgv, runDynamic } from '../dynamic/index.ts';

const hook: Hook.CommandNotFound = async function () {
  await runDynamic(getOriginalArgv());
};

export default hook;
