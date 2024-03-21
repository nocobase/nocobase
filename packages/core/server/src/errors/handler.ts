import { PluginCommandError } from './plugin-command-error';

type ErrorLevel = 'fatal' | 'silly' | 'warn';

export function getErrorLevel(e: Error): ErrorLevel {
  // @ts-ignore
  if (e.code === 'commander.unknownCommand') {
    return 'silly';
  }

  if (e instanceof PluginCommandError) {
    return 'warn';
  }

  if (e.name === 'RestoreCheckError') {
    return 'warn';
  }

  return 'fatal';
}
