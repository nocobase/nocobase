import { Plugin } from '@nocobase/server';

import initInstructions from './instructions';

export class WorkflowExtenstionsPlugin extends Plugin {
  async load() {
    initInstructions(this);
  }
}

export default WorkflowExtenstionsPlugin;
