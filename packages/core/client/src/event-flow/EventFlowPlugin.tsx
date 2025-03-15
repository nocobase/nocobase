/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '../application/Plugin';
import { EventActionSetting, EventParamKey, EventSetting, SystemParamKey, StateParamKey, PluginName } from './types';
import { EventSettingItem } from './EventSettingItem';
import { uniqBy } from 'lodash';
import { EventFlowProvider } from './EventFlowProvider';
import { EventDefinition } from './types';
import { ISchema } from '@formily/react';
import { getConditionResult, getFieldValuesInCondition, getPageSchema } from './utils';
import { conditionAnalyses } from '../schema-component/common/utils/uitls';
import { VariableOption } from '../variables/types';
import { VariablesContextType } from '../variables/types';
import { parse, str2moment } from '@nocobase/utils/client';

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
    return a.name === b.name && a.pageUid === b.pageUid && a.blockUid === b.blockUid;
  }

  static getEventUniqueKey(event: EventSetting['event']) {
    return `${event.pageUid}.${event.blockUid}.${event.definition}.${event.event}`;
  }

  static parseEventUniqueKey(key: string) {
    const [pageUid, blockUid, definition, event] = key?.split('.') || [];
    return { pageUid, blockUid, definition, event };
  }

  /**
   * 定义事件
   * @param definition 事件定义
   * @param fieldSchema 字段对应schema
   */
  define(definitions: EventDefinition[]) {
    definitions.forEach((item) => {
      const exist = this.definitions.find((def) => EventFlowPlugin.isEqual(def, item));
      if (exist) {
        Object.assign(exist, item);
      } else {
        this.definitions.push(item);
      }
    });
    console.log('definitions', this.definitions);
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
  async emit(p: {
    event: EventSetting['event'];
    params?: any;
    variables: VariablesContextType;
    localVariables: VariableOption[];
  }) {
    const rules = this.events.get(EventFlowPlugin.getEventUniqueKey(p.event))?.rules;
    const getParsedValue = (expression: string) => {
      const template = parse(expression);
      return template(p.variables);
    };
    if (rules) {
      for (const rule of rules) {
        const condition = rule.condition;
        const conditionValues = {
          [EventParamKey]: p.params,
          [StateParamKey]: {},
          [SystemParamKey]: {},
        };
        console.log('conditionValues', condition, p, conditionValues);
        // const isConditionPass = getConditionResult({ condition, values: conditionValues });
        const isConditionPass = await conditionAnalyses({
          ruleGroup: condition,
          variables: p.variables,
          localVariables: [
            ...p.localVariables,
            {
              name: '$eventValues',
              ctx: conditionValues,
            },
          ],
          variableNameOfLeftCondition: '$eventValues',
        });
        console.log('isConditionPass', isConditionPass);
        if (isConditionPass) {
          rule.actions.forEach((act: EventActionSetting) => {
            const definition = this.definitions.find((def) => def.name === act.action.definition);
            const action = definition?.actions?.find((action) => action.name === act.action.action);
            // todo 获取action的参数
            const actionParams = {};
            act.params?.forEach((param) => {
              actionParams[param.name] = getParsedValue(param.value);
            });
            console.log('执行动作3', act, action, actionParams);
            if (action) {
              action.fn(actionParams);
            }
          });
        }
      }
    }
  }
  on(event: EventSetting) {
    if (!event.event) {
      return;
    }
    this.events.set(EventFlowPlugin.getEventUniqueKey(event.event), event);
  }
}
