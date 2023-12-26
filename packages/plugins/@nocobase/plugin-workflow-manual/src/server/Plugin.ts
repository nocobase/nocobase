import actions from '@nocobase/actions';
import WorkflowPlugin, { JOB_STATUS } from '@nocobase/plugin-workflow';
import { HandlerType } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';

import path from 'path';
import { submit } from './actions';

import ManualInstruction from './ManualInstruction';

export default class extends Plugin {
  workflow: WorkflowPlugin;

  async load() {
    this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.resource({
      name: 'users_jobs',
      actions: {
        list: {
          filter: {
            $or: [
              {
                'workflow.enabled': true,
              },
              {
                'workflow.enabled': false,
                status: {
                  $ne: JOB_STATUS.PENDING,
                },
              },
            ],
          },
          handler: actions.list as HandlerType,
        },
        submit,
      },
    });

    const workflowPlugin = this.app.getPlugin('workflow') as WorkflowPlugin;
    this.workflow = workflowPlugin;
    workflowPlugin.instructions.register('manual', new ManualInstruction(workflowPlugin));
  }
}
