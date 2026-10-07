// Step `cli`: installs the application's CLI in the version the run names (or reuses it), puts it first on the agent's
// PATH through a shim that tells it where the run's credentials are, and writes those credentials (0600). Beside the
// shim go the keychain guards (keychain-guard.ts), which keep the agent away from the CLI's own keychain items.
import path from 'node:path';

import { RUNNER_DIR } from '../../core/checkout.ts';
import { CliUnavailableError, resolveCli } from '../cli.ts';
import { credentialsPath, writeRunCredentials } from '../credentials.ts';
import { writeCliShim } from '../env.ts';
import { writeKeychainGuards } from '../keychain-guard.ts';
import { cliKeychainService } from '../../protocol/index.ts';
import { PrepareError, type PrepareStep } from './types.ts';

export const cliStep: PrepareStep = {
  name: 'cli',
  failure: 'setupFailed',
  async run(context) {
    const workDir = context.workspace?.workDir;
    if (workDir === undefined) throw new Error('The workspace is not locked.');
    const { cli } = context.payload;
    let entry: string;
    try {
      entry = await resolveCli({
        paths: context.paths,
        cli,
        overrides: context.registration.cli,
        client: context.client,
        log: context.log,
      });
    } catch (error) {
      if (error instanceof CliUnavailableError)
        throw new PrepareError('cliUnavailable', error.message);
      throw error;
    }
    const binDir = path.join(workDir, RUNNER_DIR, 'bin');
    await writeCliShim(
      binDir,
      cli.name,
      entry,
      credentialsPath(workDir, cli.credential.file),
    );
    await writeKeychainGuards(binDir, cliKeychainService(cli.name), cli.name);
    context.binDir = binDir;
    context.cliEntry = entry;
    context.credentialsFile = await writeRunCredentials(
      workDir,
      cli,
      context.registration.server,
    );
  },
};
