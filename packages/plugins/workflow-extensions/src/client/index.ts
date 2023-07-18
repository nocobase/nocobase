import { Plugin } from '@nocobase/client';
import { instructions } from '@nocobase/plugin-workflow/client';
import sql from './nodes/sql';

export default class WorkflowExtensionsPlugin extends Plugin {
  async load() {
    instructions.register('sql', sql);
  }
}
