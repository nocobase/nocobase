import { Command } from 'commander';

export class AppCommand extends Command {
  private _handleByIPCServer = false;

  ipc() {
    this._handleByIPCServer = true;
    return this;
  }

  isHandleByIPCServer() {
    return this._handleByIPCServer;
  }

  createCommand(name?: string): AppCommand {
    return new AppCommand(name);
  }

  parseHandleByIPCServer(argv, parseOptions?): Boolean {
    //@ts-ignore
    const userArgs = this._prepareUserArgs(argv, parseOptions);

    if (userArgs[0] === 'nocobase') {
      userArgs.shift();
    }

    let lastCommand = this;

    for (const arg of userArgs) {
      // @ts-ignore
      const subCommand = lastCommand._findCommand(arg);
      if (subCommand) {
        lastCommand = subCommand;
      } else {
        break;
      }
    }

    return lastCommand && lastCommand.isHandleByIPCServer();
  }
}
