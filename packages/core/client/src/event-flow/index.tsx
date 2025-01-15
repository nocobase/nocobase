/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';
import { IEventFlowEvent, PluginName } from './types';
import { EventSettingItem } from './EventSettingItem';
import { uniqBy } from 'lodash';
import { EventFlowProvider } from './EventFlowProvider';

interface IEventParam {
  name: string;
  title: string;
  description: string;
  type: string;
}

export interface IEventFlowModule {
  name: string;
  title: string;
  description: string;
  actions?: Array<{
    name: string;
    title: string;
    description?: string;
    params: IEventParam[];
    fn: (params: any) => void;
  }>;
  events?: Array<{
    name: string;
    title: string;
    description: string;
    params: IEventParam[];
  }>;
  states?: IEventParam[];
}

export class EventFlowPlugin extends Plugin {
  static name = PluginName;
  modules: IEventFlowModule[] = [];
  events: Map<string, IEventFlowEvent> = new Map();
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.schemaSettingsManager.addItem('PageSettings', PluginName, {
      Component: EventSettingItem,
    });
    this.app.use(EventFlowProvider);
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }
  register(values: IEventFlowModule) {
    this.modules.push(values);
    this.modules = uniqBy(this.modules, 'name');
  }
  // 触发事件
  emit(moduleName: string, eventName: string, params: any) {
    console.log('emit', moduleName, eventName, params);
    const event = this.events.find((event) => event.event === `${moduleName}.${eventName}`);
    if (event) {
      event.actions.forEach((action) => {
        const actionModuleName = action.split('.')[0];
        const actionName = action.split('.')[1];
        const module = this.modules.find((module) => module.name === moduleName);
        const moduleAction = this.modules
          .find((module) => module.name === actionModuleName)
          ?.actions?.find((action) => action.name === actionName);
        console.log('moduleAction', moduleAction);
        if (moduleAction) {
          moduleAction?.fn(params);
        }
      });
    }
  }
  on(event: IEventFlowEvent) {
    this.events.set(event.event, event);
  }
  registerEvents(events: IEventFlowEvent[]) {
    events.forEach((event) => {
      this.on(event);
    });
  }
}
