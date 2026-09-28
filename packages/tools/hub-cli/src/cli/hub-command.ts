// What `hub upload` and `hub deploy` share: the Hub's answer becomes the command's result, and a failure a
// `CommandError` with the code, exit code and details `publishRelease` chose.
//
// Every failure message comes from a fixed string. A parse failure is reported by `AppCommand` the way every command's
// is, naming only declared flags and never a value typed on the command line; a publishing failure carries the message
// `publishRelease` chose, and anything else is reported by code alone because its message may quote a request, a
// response or an environment value. `NOCOBASE_CLI_DEBUG` prints that cause to stderr, redacted, for someone who has
// opted in to seeing it; `AppCommand` does the printing for every command.
import { AppCommand, CommandError } from '@nocobase/app-cli';

import {
  PublishingError,
  type PublishedRelease,
  type PublishingOptions,
  type ReleaseDeployResult,
  type ReleaseUploadResult,
} from '../hub-publishing.ts';

export abstract class HubCommand<
  TResult extends ReleaseUploadResult | ReleaseDeployResult,
> extends AppCommand {
  /** The code reported for a failure that is not a `PublishingError`. */
  protected abstract readonly failureCode: string;
  protected abstract readonly failureMessage: string;

  protected abstract parseFlags(): Promise<PublishingOptions>;
  protected abstract publish(
    flags: PublishingOptions,
    root: string,
  ): Promise<PublishedRelease<TResult>>;
  /** The one-line summary printed without `--json`. */
  protected abstract describe(result: TResult): string;

  override async run(): Promise<TResult> {
    const flags = await this.parseFlags();
    let published: PublishedRelease<TResult>;
    try {
      // Progress goes to stderr, which stays visible under --json, so a long wait does not go silent.
      published = await this.publish(
        {
          ...flags,
          onProgress: (message: string) => {
            this.logToStderr(message);
          },
        },
        this.rootDir,
      );
    } catch (error) {
      throw this.toCommandError(error);
    }
    const { result, warning } = published;
    this.log(this.describe(result));
    if (warning !== undefined) this.warn(warning);
    // The Hub answered with an earlier Release or deployment for the same retry identity: this run changed nothing.
    if (result.reused === true) this.setStatus('success-noop');
    return result;
  }

  private toCommandError(error: unknown): CommandError {
    if (error instanceof PublishingError) {
      return new CommandError(error.message, {
        code: error.code,
        exit: error.exitCode,
        details: error.details,
      });
    }
    // The cause is kept out of the message and printed, redacted, only under NOCOBASE_CLI_DEBUG.
    return new CommandError(
      `${this.failureMessage} Set NOCOBASE_CLI_DEBUG=1 to print the cause.`,
      { code: this.failureCode, exit: 1, cause: error },
    );
  }
}
