import { ResourceActionParams } from './acl-resource-action';

export type ResourceActions = { [key: string]: ResourceActionParams };

export type AclResourceActionsOption = false | '*' | ResourceActions;

interface AclResourceOptions {
  actions: AclResourceActionsOption;
}

export class AclResource {
  allowAll: boolean;
  denyAll: boolean;

  actions = new Map<string, ResourceActionParams>();

  constructor(options?: AclResourceOptions) {
    if (!options) {
      options = { actions: {} };
    }

    if (options.actions === false) {
      this.denyAll = true;
    } else if (options.actions === '*') {
      this.allowAll = true;
    } else {
      const actionsOption: ResourceActions = options.actions;
      for (const actionName of Object.keys(actionsOption)) {
        this.actions.set(actionName, actionsOption[actionName]);
      }
    }
  }

  getAction(name: string) {
    return this.actions.get(name);
  }

  setAction(name: string, params: ResourceActionParams) {
    this.actions.set(name, params || {});
  }

  removeAction(name: string) {
    this.actions.delete(name);
  }
}
