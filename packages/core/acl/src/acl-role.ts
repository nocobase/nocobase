import { ACL, DefineOptions } from './acl';
import { ACLAvailableStrategy, AvailableStrategyOptions } from './acl-available-strategy';
import { ACLResource } from './acl-resource';
import lodash from 'lodash';

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
  snippetPatterns: Set<string> = new Set();

  constructor(public acl: ACL, public name: string) {}

  getResource(name: string): ACLResource | undefined {
    return this.resources.get(name);
  }

  public setStrategy(value: string | AvailableStrategyOptions) {
    this.strategy = value;
  }

  public getStrategy() {
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
    let results = null;

    for (const snippetRule of this.snippetPatterns) {
      const result = this.acl.snippetManager.allow(actionPath, snippetRule);
      if (result === false) {
        return false;
      }

      results = result;
    }

    return results;
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
      snippets: Array.from(this.snippetPatterns),
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
