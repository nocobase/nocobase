import { Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../lib/command.ts';
import {
  normalizeServer,
  readConnections,
  removeConnection,
} from '../lib/config.ts';
import { EXIT_CODES } from '../protocol/index.ts';

export default class Unregister extends RunnerCommand {
  static override summary: string =
    "Forget an application's registration and its runner key.";
  static override description: string =
    'The application keeps its record of the runner until someone removes it there; a running daemon stops serving ' +
    'the application when it restarts.';
  static override flags: {
    server: Interfaces.OptionFlag<string>;
  } = {
    server: Flags.string({
      description: 'The application server URL the runner registered with.',
      required: true,
    }),
  };

  async run(): Promise<{ app: string }> {
    const { flags } = await this.parse(Unregister);
    const server = normalizeServer(flags.server);
    const connection = (await readConnections(this.paths)).find(
      (candidate) => candidate.registration.server === server,
    );
    if (connection === undefined)
      throw new UsageError(
        `Not registered with ${server}.`,
        EXIT_CODES.notFound,
      );
    await removeConnection(connection.registration.key, this.paths);
    this.log(`Removed the registration with ${server}.`);
    return { app: connection.registration.key };
  }
}
