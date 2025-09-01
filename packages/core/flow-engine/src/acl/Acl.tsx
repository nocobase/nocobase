/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '../models/flowModel';
import { FlowEngine } from '../flowEngine';

interface CheckOptions {
  dataSourceKey: string;
  resourceName: string;
  actionName: string;
  fields?: string[];
}

export class ACL {
  private dataSources: Record<string, any> = {};
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor(private flowEngine: FlowEngine) {}

  async load() {
    if (this.loaded) return;

    if (!this.loadingPromise) {
      this.loadingPromise = (async () => {
        const { data } = await this.flowEngine.context.api.request({
          url: 'roles:check',
        });
        this.dataSources = data || {};
        this.loaded = true;
      })();
    }

    await this.loadingPromise;
  }

  getActionAlias(actionName: string) {
    return this.dataSources.data?.actionAlias?.[actionName] || actionName;
  }

  inResources(resourceName: string) {
    return this.dataSources.data?.resources?.includes?.(resourceName);
  }
  getResourceActionParams(resourceName, actionName) {
    const actionAlias = this.getActionAlias(actionName);
    return (
      this.dataSources.data?.actions?.[`${resourceName}:${actionAlias}`] || this.dataSources.data?.actions?.[actionName]
    );
  }

  getStrategyActionParams(actionName: string) {
    const actionAlias = this.getActionAlias(actionName);
    const strategyAction = this.dataSources.data?.strategy?.actions?.find((action) => {
      const [value] = action.split(':');
      return value === actionAlias;
    });
    return strategyAction ? {} : null;
  }

  parseAction(options: CheckOptions) {
    const { resourceName, actionName, dataSourceKey = 'main' } = options;
    const targetResource =
      resourceName?.includes('.') &&
      this.flowEngine.context.dataSourceManager
        .getDataSource(dataSourceKey)
        .collectionManager.getAssociation(resourceName)?.target;

    if (this.inResources(targetResource)) {
      return this.getResourceActionParams(targetResource, actionName);
    }
    if (this.inResources(resourceName)) {
      return this.getResourceActionParams(resourceName, actionName);
    }
    return this.getStrategyActionParams(actionName);
  }

  parseField(options: CheckOptions) {
    const { fields } = options;
    const params = this.parseAction(options);
    const whitelist = []
      .concat(params?.whitelist || [])
      .concat(params?.fields || [])
      .concat(params?.appends || []);
    if (params && !Object.keys(params).length) {
      return true;
    }
    const allowed = whitelist.includes(fields[0]);
    return allowed;
  }

  async aclCheck(options: CheckOptions): Promise<boolean> {
    await this.load();
    const { data } = this.dataSources;
    const { allowAll } = data;
    if (allowAll) {
      return true;
    }
    if (options.fields) {
      return this.parseField(options);
    }
    return this.parseAction(options);
  }
}
