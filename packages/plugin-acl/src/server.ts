import { Plugin } from '@nocobase/server';
import { ACL } from '@nocobase/acl';
import { acl } from './acl';
import path from 'path';
import { availableActionResource } from './actions/available-actions';
import { roleCollectionsResource } from './actions/role-collections';

export default class PluginACL extends Plugin {
  acl: ACL;

  async load() {
    this.acl = acl;

    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.resourcer.define(availableActionResource);
    this.app.resourcer.define(roleCollectionsResource);

    this.app.db.on('roles.afterSave', (model) => {
      const roleName = model.get('name');
      let role = acl.getRole(roleName);

      if (!role) {
        role = acl.define({
          role: model.get('name'),
        });
      }

      role.setStrategy(model.get('strategy'));
    });

    this.app.db.on('rolesResources.afterSave', async (model, options) => {});

    this.app.db.on('rolesResourcesActions.afterSave', async (model) => {
      const resource = await model.getResource();
      const roleName = resource.get('roleName');
      const role = acl.getRole(roleName);
      const fields = model.get('fields');

      const actionPath = `${resource.get('name')}:${model.get('name')}`;

      const actionParams = {
        fields,
      };

      const scope = await model.getScope();

      if (scope) {
        actionParams['filter'] = scope.get('scope');
      }

      role.grantAction(actionPath, actionParams);
    });
  }
}
