import { Plugin } from '@nocobase/server';
import actions from '@nocobase/actions';
import { HandlerType } from '@nocobase/resourcer';
import WorkflowPlugin, { JOB_STATUS } from '@nocobase/plugin-workflow';

import jobsCollection from './collecions/jobs';
import usersCollection from './collecions/users';
import usersJobsCollection from './collecions/users_jobs';
import { submit } from './actions';

import ManualInstruction from './ManualInstruction';

export default class WorkflowManualPlugin extends Plugin {
  workflow: WorkflowPlugin;

  beforeLoad() {
    this.app.on('afterLoadPlugin', (plugin) => {
      if (!(plugin instanceof WorkflowPlugin)) {
        return;
      }
      this.workflow = plugin;
      plugin.instructions.register('manual', new ManualInstruction(plugin));
    });
  }

  async load() {
    this.app.db.collection(usersJobsCollection);
    this.app.db.extendCollection(usersCollection);
    this.app.db.extendCollection(jobsCollection);

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
  }
}
