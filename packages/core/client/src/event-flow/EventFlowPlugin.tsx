/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';
import { EventSetting, PluginName } from './types';
import { EventSettingItem } from './EventSettingItem';
import { uniqBy } from 'lodash';
import { EventFlowProvider } from './EventFlowProvider';
import { EventDefinition } from './types';

export class EventFlowPlugin extends Plugin {
  static name = PluginName;
  /** 事件定义 */
  definitions: EventDefinition[] = [];
  /** 事件设置 */
  events: Map<string, EventSetting> = new Map();

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.schemaSettingsManager.addItem('PageSettings', PluginName, {
      Component: EventSettingItem,
    });
    // this.app.use(EventFlowProvider);
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()
  }

  static isEqual(a: EventDefinition, b: EventDefinition) {
    return a.name === b.name && a.uid === b.uid;
  }

  // 定义事件
  define(definition: EventDefinition | EventDefinition[]) {
    if (!definition) {
      return;
    }
    if (Array.isArray(definition)) {
      this.definitions.push(...definition);
    } else {
      this.definitions.push(definition);
    }
    this.definitions = uniqBy(this.definitions, (item) => item.name + item.uid);
  }
  // 移除定义事件
  removeDefinition(definition: EventDefinition | EventDefinition[]) {
    if (!definition) {
      return;
    }
    if (Array.isArray(definition)) {
      this.definitions = this.definitions.filter((item) => !definition.some((d) => EventFlowPlugin.isEqual(item, d)));
    } else {
      this.definitions = this.definitions.filter((item) => !EventFlowPlugin.isEqual(item, definition));
    }
  }
  // 运行时注册事件
  register(events: EventSetting[]) {
    console.log('todo register', events);
    // events?.forEach((event) => {
    //   this.on(event);
    // });
  }
  // 触发事件
  async emit({ name, eventName, uid, params }: { name: string; eventName: string; uid?: string; params?: any }) {
    // console.log('emit', name, eventName, params);
    // const event = this.events.find((event) => event.event === `${name}.${eventName}`);
    // if (event) {
    //   event.actions.forEach((action) => {
    //     const actionModuleName = action.split('.')[0];
    //     const actionName = action.split('.')[1];
    //     const module = this.definitions.find((definition) => definition.name === name);
    //     const moduleAction = this.definitions
    //       .find((module) => module.name === actionModuleName)
    //       ?.actions?.find((action) => action.name === actionName);
    //     if (moduleAction) {
    //       moduleAction?.fn(params);
    //     }
    //   });
    // }
  }
  on(event: EventSetting) {
    this.events.set(event.event, event);
  }
}
