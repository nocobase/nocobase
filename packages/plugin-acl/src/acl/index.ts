import { ACL } from '@nocobase/acl';
import { availableActions } from './available-action';

function createACL() {
  const acl = new ACL();

  for (const [actionName, actionParams] of Object.entries(availableActions)) {
    acl.setAvailableAction(actionName, actionParams);
  }

  return acl;
}

const acl = createACL();

export { acl };
