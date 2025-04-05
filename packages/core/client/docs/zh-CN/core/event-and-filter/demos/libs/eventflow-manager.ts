import { ISchema, Schema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import _ from 'lodash';

export type EventFlowEventHandler = (params: Record<string, any>, context: any) => Promise<any>;
export type EventFlowActionHandler = (params: Record<string, any>, context: any) => Promise<any>;

export type EventFlowEventGroupOptions = {
  name: string;
  title: string;
  sort: number;
};

export type EventFlowEventOptions = {
  name: string;
  title: string;
  description?: string;
  group: string;
  sort: number;
  uiSchema: Record<string, ISchema>;
  handler?: EventFlowEventHandler;
};

export type EventFlowActionGroupOptions = {
  name: string;
  title: string;
  sort: number;
};

export type EventFlowActionOptions = {
  name: string;
  title: string;
  description?: string;
  group: string;
  sort: number;
  uiSchema: Record<string, ISchema>;
  handler: EventFlowActionHandler;
};

export type EventFlowStepOptions = {
  key?: string;
  action: string;
  title?: string;
  params?: Record<string, any>;
  condition?: string;
  isAwait?: boolean;
};

export type EventFlowOnOptions = {
  event?: string;
  title?: string;
  condition?: string;
  params?: Record<string, any>;
};

export type EventFlowOptions = {
  sort?: number;
  isAwait?: boolean;
  key?: string;
  title?: string;
  on?: EventFlowOnOptions;
  steps?: EventFlowStepOptions[];
};

export class EventFlowStep {
  options: EventFlowStepOptions;

  constructor(options: EventFlowStepOptions) {
    this.options = observable(options);
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

  get isAwait() {
    return this.options.isAwait;
  }

  get params() {
    return this.options.params;
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

  async save() {
    // TODO;
  }
}

export class EventFlow {
  protected eventFlowManager: EventFlowManager;
  protected options: EventFlowOptions;
  protected changed: Record<string, any> = {};
  protected eventFlowSteps: Record<string, EventFlowStep>;

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

  hasSteps() {
    return Object.values(this.eventFlowSteps).length > 0;
  }

  eachStep(callback: (step: EventFlowStep) => any) {
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

  addStep(step: EventFlowStepOptions) {
    if (!step.key) {
      step.key = uid();
    }
    const instance = new EventFlowStep(step);
    this.eventFlowSteps[step.key] = instance;
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
    await this.executeHandler(event.handler, trigger.params, context);

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
      const action = this.eventFlowManager.getAction(step.action);
      if (action) {
        if (this.checkCondition(step.condition, context)) {
          if (step.isAwait !== false) {
            await this.executeHandler(action.handler, step.params, context);
          } else {
            this.executeHandler(action.handler, step.params, context);
          }
        }
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

  constructor() {
    this.flows = observable.shallow({});
  }

  // 注册事件分组
  addEventGroup(group: EventFlowEventGroupOptions) {
    this.eventGroups[group.name] = group;
  }

  // 注册事件
  addEvent(event: EventFlowEventOptions) {
    this.events[event.name] = event;
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

  removeFlow(key) {
    delete this.flows[key];
  }

  getFlow(key: string) {
    return this.flows[key];
  }

  getFlows() {
    return this.flows;
  }

  // 触发事件
  async dispatchEvent(eventName: string, context: any): Promise<void> {
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
