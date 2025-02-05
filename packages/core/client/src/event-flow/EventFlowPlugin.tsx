/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';
import { EventActionSetting, EventSetting, PluginName } from './types';
import { EventSettingItem } from './EventSettingItem';
import { uniqBy } from 'lodash';
import { EventFlowProvider } from './EventFlowProvider';
import { EventDefinition } from './types';
import { ISchema } from '@formily/react';
import { getPageSchema } from './utils';

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
    return a.name === b.name && a.uid === b.uid && a.pageUid === b.pageUid;
  }

  static getEventUniqueKey(event: EventSetting['event']) {
    return `${event.definition}.${event.event}`;
  }

  /**
   * 定义事件
   * @param definition 事件定义
   * @param fieldSchema 字段对应schema
   */
  define(definition: EventDefinition | EventDefinition[], fieldSchema?: ISchema) {
    const uid = fieldSchema?.['x-uid'];
    const pageSchema = getPageSchema(fieldSchema);
    const pageUid = pageSchema?.['x-uid'];
    if (!definition) {
      return;
    }
    const definitions = Array.isArray(definition) ? definition : [definition];
    definitions.forEach((item) => {
      item.uid = uid;
      item.pageUid = pageUid;
    });
    this.definitions.push(...definitions);
    this.definitions = uniqBy(this.definitions, (item) => item.name + item.uid);
  }
  // 移除定义事件
  // removeDefinition(definition: EventDefinition | EventDefinition[]) {
  //   if (!definition) {
  //     return;
  //   }
  //   const definitions = Array.isArray(definition) ? definition : [definition];
  //   this.definitions = this.definitions.filter((item) => !definitions.some((d) => EventFlowPlugin.isEqual(item, d)));
  // }
  // 运行时注册事件
  register(events: EventSetting[]) {
    events?.forEach((event) => {
      this.on(event);
    });
  }
  /**
   * 触发事件
   * @param p.event 事件
   * @param p.params 事件上报的参数
   */
  async emit(p: { event: EventSetting['event']; params?: any }) {
    console.log('emit', p);
    const event = this.events.get(EventFlowPlugin.getEventUniqueKey(p.event));
    if (event) {
      const condition = event.condition;
      const isCondition = false;
      // todo 条件判断
      if (!isCondition) {
        return;
      }
      event.actions.forEach((act: EventActionSetting) => {
        const definition = this.definitions.find((def) => def.name === act.definition);
        const action = definition?.actions?.find((action) => action.name === act.action);
        // todo 获取action的参数
        const actionParams = act.params;
        if (action) {
          action.fn(actionParams);
        }
      });
    }
  }
  on(event: EventSetting) {
    this.events.set(EventFlowPlugin.getEventUniqueKey(event.event), event);
  }
}
