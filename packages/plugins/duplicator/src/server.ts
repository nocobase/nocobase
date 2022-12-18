import { Plugin } from '@nocobase/server';
import addDumpCommand from './commands/dump';
import addRestoreCommand from './commands/restore';

export default class Duplicator extends Plugin {
  beforeLoad() {
    addDumpCommand(this.app);
    addRestoreCommand(this.app);
  }
}
