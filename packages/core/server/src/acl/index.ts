import { ACL } from '@nocobase/acl';
import { availableActions } from './available-action';
import lodash from 'lodash';

const configureResources = [
  'roles',
  'collections',
  'roles.collections',
  'roles.resources',
  'rolesResourcesScopes',
  'availableActions',
];

export function createACL() {
  const acl = new ACL();

  for (const [actionName, actionParams] of Object.entries(availableActions)) {
    acl.setAvailableAction(actionName, actionParams);
  }

  acl.registerConfigResources(configureResources);

  return acl;
}
