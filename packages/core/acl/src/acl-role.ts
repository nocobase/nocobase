import { ACL, DefineOptions } from './acl';
import { ACLAvailableStrategy, AvailableStrategyOptions } from './acl-available-strategy';
import { ACLResource } from './acl-resource';
import lodash from 'lodash';
import minimatch from 'minimatch';

export interface RoleActionParams {
  fields?: string[];
  filter?: any;
  own?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  [key: string]: any;
}

export interface ResourceActionsOptions {
  [actionName: string]: RoleActionParams;
}

export class ACLRole {
  strategy: string | AvailableStrategyOptions;
  resources = new Map<string, ACLResource>();
  snippets: Set<string> = new Set();

  constructor(public acl: ACL, public name: string) {}

  getResource(name: string): ACLResource | undefined {
    return this.resources.get(name);
  }

  public setStrategy(value: string | AvailableStrategyOptions) {
    this.strategy = value;
  }

  public getStrategy() {
    if (!this.strategy) {
      return null;
    }
    return lodash.isString(this.strategy)
      ? this.acl.availableStrategy.get(this.strategy)
      : new ACLAvailableStrategy(this.acl, this.strategy);
  }

  public getResourceActionsParams(resourceName: string) {
    const resource = this.getResource(resourceName);
    return resource.getActions();
  }

  public revokeResource(resourceName: string) {
    for (const key of [...this.resources.keys()]) {
      if (key === resourceName || key.includes(`${resourceName}.`)) {
        this.resources.delete(key);
      }
    }
  }

  public grantAction(path: string, options?: RoleActionParams) {
    let { resource, resourceName, actionName } = this.getResourceActionFromPath(path);

    if (!resource) {
      resource = new ACLResource({
        role: this,
        name: resourceName,
      });

      this.resources.set(resourceName, resource);
    }

    resource.setAction(actionName, options);
  }

  public getActionParams(path: string): RoleActionParams {
    const { action } = this.getResourceActionFromPath(path);
    return action;
  }

  public revokeAction(path: string) {
    const { resource, actionName } = this.getResourceActionFromPath(path);
    resource.removeAction(actionName);
  }

  public snippetAllowed(actionPath: string) {
    const allowedActions = [];
    const rejectedActions = [];

    const actionMatched = (actionPath, actionRule) => {
      return minimatch(actionPath, actionRule);
    };

    for (const snippetRule of this.snippets) {
      const actions = this.acl.snippetManager.getActions(snippetRule);

      if (snippetRule.startsWith('!')) {
        rejectedActions.push(...actions);
      } else {
        allowedActions.push(...actions);
      }
    }

    if (rejectedActions.some((actionRule) => actionMatched(actionPath, actionRule))) {
      return false;
    }

    if (allowedActions.some((actionRule) => actionMatched(actionPath, actionRule))) {
      return true;
    }

    return null;
  }

  public toJSON(): DefineOptions {
    const actions = {};

    for (const resourceName of this.resources.keys()) {
      const resourceActions = this.getResourceActionsParams(resourceName);
      for (const actionName of Object.keys(resourceActions)) {
        actions[`${resourceName}:${actionName}`] = resourceActions[actionName];
      }
    }

    return {
      role: this.name,
      strategy: this.strategy,
      actions,
      snippets: Array.from(this.snippets),
    };
  }

  protected getResourceActionFromPath(path: string) {
    const [resourceName, actionName] = path.split(':');

    const resource = this.resources.get(resourceName);

    let action = null;
    if (resource) {
      action = resource.getAction(actionName);
    }

    return {
      resourceName,
      actionName,
      resource,
      action,
    };
  }
}
