import { ACL } from '@nocobase/acl';
import { availableActions } from './available-action';

const configureResources = ['roles', 'collections', 'resources', 'rolesResourcesScopes', 'availableActions'];

export function createACL() {
  const acl = new ACL();

  for (const [actionName, actionParams] of Object.entries(availableActions)) {
    acl.setAvailableAction(actionName, actionParams);
  }

  acl.registerConfigResources(configureResources);

  return acl;
}
