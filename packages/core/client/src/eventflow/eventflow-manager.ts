/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import _ from 'lodash';
import { EventBus } from './event-bus';
import type {
  EventFlowActionHandler,
  EventFlowActionGroupOptions,
  EventFlowActionOptions,
  EventFlowEventHandler,
  EventFlowEventGroupOptions,
  EventFlowEventOptions,
  EventFlowOptions,
  EventFlowStepOptions,
  IEventFlowStep,
} from './types';

export class ConfigEventFlowStep implements IEventFlowStep {
  options: EventFlowStepOptions;
  protected eventFlow: EventFlow;

  constructor(options: EventFlowStepOptions) {
    this.options = observable(options);
  }

  setEventFlow(eventFlow: EventFlow) {
    this.eventFlow = eventFlow;
  }

  get key() {
    return this.options.key;
  }

  get title() {
    return this.options.title;
  }

  get action() {
    return this.options.action;
  }

  getUiSchema(): Record<string, ISchema> | undefined {
    return this.eventFlow.eventFlowManager.getAction(this.action)?.uiSchema;
  }

  get isAwait() {
    return this.options.isAwait;
  }

  get condition() {
    return this.options.condition;
  }

  get(key) {
    return _.get(this.options, key);
  }

  set(key, value?: any) {
    if (typeof key === 'object' && typeof value === 'undefined') {
      for (const k in key) {
        if (Object.prototype.hasOwnProperty.call(key, k)) {
          const val = key[k];
          _.set(this.options, k, val);
        }
      }
    } else {
      _.set(this.options, key, value);
    }
  }

  getHandler(): EventFlowActionHandler | undefined {
    const action = this.eventFlow.eventFlowManager.getAction(this.action);
    return action?.handler;
  }

  async save() {
    // TODO;
  }
}

export class FunctionEventFlowStep implements IEventFlowStep {
  private readonly _handler: EventFlowActionHandler;
  private readonly _key: string;
  protected eventFlow: EventFlow;
  private _isAwait: boolean = true;

  constructor(handler: EventFlowActionHandler) {
    this._handler = handler;
    this._key = uid();
  }

  setEventFlow(eventFlow: EventFlow) {
    this.eventFlow = eventFlow;
  }

  get key() {
    return this._key;
  }

  get isAwait() {
    return this._isAwait;
  }

  set isAwait(value: boolean) {
    this._isAwait = value;
  }

  get condition() {
    return undefined;
  }

  getHandler(): EventFlowActionHandler | undefined {
    return this._handler;
  }

  getUiSchema(): Record<string, ISchema> | undefined {
    return undefined;
  }
}

export class EventFlow {
  eventFlowManager: EventFlowManager;
  protected options: EventFlowOptions;
  protected changed: Record<string, any> = {};
  protected eventFlowSteps: Record<string, IEventFlowStep>;

  isNew = false;

  constructor(options: EventFlowOptions) {
    this.eventFlowSteps = observable.shallow({});
    if (Array.isArray(options.steps)) {
      for (const step of options.steps) {
        this.addStep(step);
      }
    }
    this.options = observable(options);
  }

  getSteps() {
    return Object.values(this.eventFlowSteps);
  }

  getStep(key: string) {
    return this.eventFlowSteps[key];
  }

  hasSteps() {
    return Object.values(this.eventFlowSteps).length > 0;
  }

  eachStep(callback: (step: IEventFlowStep) => any) {
    return Object.values(this.eventFlowSteps).map(callback);
  }

  get onEvent(): EventFlowEventOptions {
    if (!this.on?.event) {
      return {} as EventFlowEventOptions;
    }
    const event = this.eventFlowManager.getEvent(this.on.event);
    if (!event) {
      return {} as EventFlowEventOptions;
    }
    return event;
  }

  get key() {
    return this.options.key;
  }

  get title() {
    return this.options.title;
  }

  get on() {
    return this.options.on || {};
  }

  get isAwait() {
    return this.options.isAwait;
  }

  get steps() {
    return this.options.steps || [];
  }

  getOptions() {
    return this.options;
  }

  setOptions(options: EventFlowOptions) {
    this.options = options;
  }

  get(key) {
    return _.get(this.options, key);
  }

  set(key, value) {
    _.set(this.options, key, value);
  }

  getOption(key) {
    return this.options[key];
  }

  setOption(key, value) {
    this.options[key] = value;
  }

  setEventFlowManager(eventFlowManager: EventFlowManager) {
    this.eventFlowManager = eventFlowManager;
  }

  addStep(step: EventFlowStepOptions | EventFlowActionHandler) {
    let instance: IEventFlowStep;

    if (typeof step === 'function') {
      instance = new FunctionEventFlowStep(step);
    } else {
      if (!step.key) {
        step.key = uid();
      }
      instance = new ConfigEventFlowStep(step);
    }
    
    instance.setEventFlow(this);
    this.eventFlowSteps[instance.key] = instance;
    return instance;
  }

  removeStep(key: string) {
    delete this.eventFlowSteps[key];
  }

  async save() {
    this.isNew = false;
    // TODO: 保存
  }

  async remove() {
    this.eventFlowManager.removeFlow(this.key);
  }

  async trigger(eventName, context: any) {
    const event = this.eventFlowManager.getEvent(eventName);
    if (!event) {
      console.warn(`Event '${eventName}' not found.`);
      return;
    }
    const trigger = this.options.on;
    if (trigger.event !== eventName) {
      return;
    }
    if (!this.checkCondition(trigger.condition, context)) {
      return;
    }
    // 触发器执行函数
    const eventParams = context?.meta?.eventParams?.[this.key];
    await this.executeHandler(event.handler, eventParams, context);

    if (!this.hasSteps()) {
      console.warn(`Event '${eventName}' has no steps defined.`);
      return;
    }
    // 执行步骤
    await this.executeSteps(context);
  }

  private checkCondition(condition?: string, context?: any) {
    if (!condition) {
      return true; // 如果没有条件，默认条件为 true
    }
    // 处理条件检查，简单示例：用 handlebars 或正则做模板替换
    const parsedCondition = this.parseTemplate(condition, context);
    return !!parsedCondition;
  }

  private parseTemplate(template: any, ctx: any): string {
    return Schema.compile(template, { ctx });
  }

  private async executeHandler(
    handler: EventFlowEventHandler | EventFlowActionHandler,
    params: Record<string, any>,
    context: any,
  ): Promise<void> {
    await handler?.(params, context); // 确保处理器是异步的
  }

  // 执行事件流中的步骤
  private async executeSteps(context: any): Promise<void> {
    for (const step of this.getSteps()) {
      // 获取处理器
      const handler = step.getHandler();
      if (!handler) {
        continue;
      }

      // 检查条件
      if (step.condition && !this.checkCondition(step.condition, context)) {
        continue;
      }

      // 执行处理器
      try {
        const stepParams = context?.meta?.stepParams?.[step.key];
        if (step.isAwait !== false) {
          await this.executeHandler(handler, stepParams, context);
        } else {
          this.executeHandler(handler, stepParams, context);
        }
      } catch (error) {
        console.error(`Error executing step "${step.key}":`, error);
      }
    }
  }
}

export class EventFlowManager {
  private eventGroups: Record<string, EventFlowEventGroupOptions> = {};
  private events: Record<string, EventFlowEventOptions> = {};
  private actionGroups: Record<string, EventFlowActionGroupOptions> = {};
  private actions: Record<string, EventFlowActionOptions> = {};
  private flows: Record<string, EventFlow> = {};
  private eventBus?: EventBus;

  constructor(eventBus: EventBus) {
    this.flows = observable.shallow({});
    this.eventBus = eventBus; // 存储 EventBus 实例
  }

  // 注册事件分组
  addEventGroup(group: EventFlowEventGroupOptions) {
    this.eventGroups[group.name] = group;
  }

  // 注册事件
  addEvent(event: EventFlowEventOptions) {
    this.events[event.name] = event;

    if (this.eventBus) {
      // 在 EventBus 上注册事件监听
      this.eventBus.on(event.name, (ctx) => {
        // 当原始事件触发时，触发对应的 EventFlow 事件
        this.dispatchEvent(event.name, ctx);
      });
    }
  }

  getEvent(eventName: string) {
    return this.events[eventName];
  }

  getEventsByGroup() {
    const items = [];
    for (const group of Object.values(this.eventGroups)) {
      items.push({
        key: group.name,
        label: group.title,
        type: 'group',
        children: Object.values(this.events)
          .filter((item) => item.group === group.name)
          .map((item) => {
            return {
              key: item.name,
              label: item.title,
            };
          }),
      });
    }
    return items;
  }

  // 注册操作分组
  addActionGroup(group: EventFlowActionGroupOptions) {
    this.actionGroups[group.name] = group;
  }

  // 注册操作
  addAction(action: EventFlowActionOptions) {
    this.actions[action.name] = action;
  }

  getAction(actionName: string) {
    return this.actions[actionName];
  }

  getActionsByGroup() {
    const items = [];
    for (const group of Object.values(this.actionGroups)) {
      items.push({
        key: group.name,
        label: group.title,
        type: 'group',
        children: Object.values(this.actions)
          .filter((item) => item.group === group.name)
          .map((item) => {
            return {
              key: item.name,
              label: item.title,
            };
          }),
      });
    }
    return items;
  }

  // 注册事件流
  addFlow(options: EventFlowOptions | EventFlow) {
    if (options instanceof EventFlow) {
      options.setEventFlowManager(this);
      if (!options.key) {
        options.setOption('key', uid());
      }
      this.flows[options.key] = options;
      return options;
    }
    options.key = options.key || uid();
    const eventFlow = new EventFlow(options);
    eventFlow.setEventFlowManager(this);
    this.flows[options.key] = eventFlow;
    return eventFlow;
  }

  removeFlow(key: string) {
    delete this.flows[key];
  }

  getFlow(key: string) {
    return this.flows[key];
  }

  getFlows() {
    return this.flows;
  }

  async dispatchEvent(eventName: string, context: any) {
    const event = this.getEvent(eventName);
    if (!event) {
      console.warn(`Event '${eventName}' not found.`);
      return;
    }

    // 检查事件流
    for (const flow of Object.values(this.flows)) {
      if (flow.isAwait === false) {
        await flow.trigger(eventName, context);
      } else {
        flow.trigger(eventName, context);
      }
    }
  }
}
