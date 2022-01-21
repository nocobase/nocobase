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
  }
}
