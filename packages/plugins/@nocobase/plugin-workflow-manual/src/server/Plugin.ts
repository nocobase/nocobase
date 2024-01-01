import { Plugin } from '@nocobase/server';
import actions from '@nocobase/actions';
import { HandlerType } from '@nocobase/resourcer';
import WorkflowPlugin, { JOB_STATUS } from '@nocobase/plugin-workflow';

import jobsCollection from './collections/jobs';
import usersCollection from './collections/users';
import usersJobsCollection from './collections/users_jobs';
import { submit } from './actions';

import ManualInstruction from './ManualInstruction';

export default class extends Plugin {
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

    this.app.acl.allow('users_jobs', ['list', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);
    workflowPlugin.registerInstruction('manual', ManualInstruction);
  }
}
