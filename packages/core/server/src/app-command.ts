import { Command } from 'commander';

export class AppCommand extends Command {
  private _handleByIPCServer = false;

  handleByIPCServer() {
    this._handleByIPCServer = true;
    return this;
  }

  createCommand(name?: string): AppCommand {
    return new AppCommand(name);
  }

  findCommand(argv, options) {
    // @ts-ignore
    const userArgs = this._prepareUserArgs(argv, options);

    console.log('userArgs', userArgs);
  }
}
