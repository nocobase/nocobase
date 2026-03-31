/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { default as _, default as lodash } from 'lodash';
import minimatch from 'minimatch';
import { ACL, DefineOptions } from './acl';
import { ACLAvailableStrategy, AvailableStrategyOptions } from './acl-available-strategy';
import { ACLResource } from './acl-resource';

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

/**
 * @internal
 */
export class ACLRole {
  strategy: string | AvailableStrategyOptions;
  resources = new Map<string, ACLResource>();
  snippets: Set<string> = new Set();
  _snippetCache = {
    params: null,
    result: null,
  };

  constructor(
    public acl: ACL,
    public name: string,
  ) {}

  _serializeSet(set: Set<string>) {
    return JSON.stringify([...set].sort());
  }

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
    let { resource } = this.getResourceActionFromPath(path);
    const { resourceName, actionName } = this.getResourceActionFromPath(path);

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

  public effectiveSnippets(): { allowed: Array<string>; rejected: Array<string> } {
    const currentParams = this._serializeSet(this.snippets);

    if (this._snippetCache.params === currentParams) {
      return this._snippetCache.result;
    }

    const allowedSnippets = new Set<string>();
    const rejectedSnippets = new Set<string>();

    const availableSnippets = this.acl.snippetManager.snippets;

    for (let snippetRule of this.snippets) {
      const negated = snippetRule.startsWith('!');
      snippetRule = negated ? snippetRule.slice(1) : snippetRule;

      for (const [_, availableSnippet] of availableSnippets) {
        if (minimatch(availableSnippet.name, snippetRule)) {
          if (negated) {
            rejectedSnippets.add(availableSnippet.name);
          } else {
            allowedSnippets.add(availableSnippet.name);
          }
        }
      }
    }

    // get difference of allowed and rejected snippets
    const effectiveSnippets = new Set([...allowedSnippets].filter((x) => !rejectedSnippets.has(x)));

    this._snippetCache = {
      params: currentParams,
      result: {
        allowed: [...effectiveSnippets],
        rejected: [...rejectedSnippets],
      },
    };

    return this._snippetCache.result;
  }

  public snippetAllowed(actionPath: string) {
    const effectiveSnippets = this.effectiveSnippets();

    const getActions = (snippets) => {
      return snippets.map((snippetName) => this.acl.snippetManager.snippets.get(snippetName).actions).flat();
    };

    const allowedActions = getActions(effectiveSnippets.allowed);
    const rejectedActions = getActions(effectiveSnippets.rejected);

    const actionMatched = (actionPath, actionRule) => {
      return minimatch(actionPath, actionRule);
    };

    for (const action of allowedActions) {
      if (actionMatched(actionPath, action)) {
        return true;
      }
    }

    for (const action of rejectedActions) {
      if (actionMatched(actionPath, action)) {
        return false;
      }
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

    return _.cloneDeep({
      role: this.name,
      strategy: this.strategy,
      actions,
      snippets: Array.from(this.snippets),
    });
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
