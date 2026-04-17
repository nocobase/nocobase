import { Command } from '@oclif/core';

export default class Api extends Command {
  static summary = 'Work with NocoBase APIs, environments, resources, and runtime commands';
  static id = 'api';

  async run(): Promise<void> {
    this.log('Use `nb api --help` to view available subcommands.');
  }
}
