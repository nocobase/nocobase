import { Command } from '@oclif/core';

export default class Resource extends Command {
  static summary = 'Work with generic collection resources';

  async run(): Promise<void> {
    this.log('Use `nocobase-ctl resource --help` to view available subcommands.');
  }
}
