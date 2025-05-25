import { ISchema } from '@formily/json-schema';
import type { FlowModel } from '@nocobase/client';
import type { Application } from '../application/Application';
import { FlowEngine } from './flowEngine';

/**
 * Constructor for model classes.
 */
export type ModelConstructor<T extends FlowModel = FlowModel> = new (
  uid: string,
  app?: Application,
  stepParams?: Record<string, any>,
) => T;

/**
 * Defines a reusable action with generic model type support.
 */
export interface ActionDefinition<TModel extends FlowModel = FlowModel> {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowContext, model: TModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>;
  defaultParams?: Record<string, any>;
}

/**
 * Defines a flow with generic model type support.
 */
export interface FlowDefinition<TModel extends FlowModel = FlowModel> {
  key: string; // Unique identifier for the flow
  title?: string;
  /**
   * Whether this flow is a default flow that should be automatically executed
   */
  default?: boolean;
  /**
   * Sort order for flow execution, lower numbers execute first
   * Defaults to 0, can be negative
   */
  sort?: number;
  /**
   * Optional configuration to allow this flow to be triggered by `dispatchEvent`.
   */
  on?: {
    eventName: string;
  };
  steps: Record<string, StepDefinition<TModel>>;
}

/**
 * Base interface for a step definition with generic model type support.
 */
interface BaseStepDefinition<TModel extends FlowModel = FlowModel> {
  title?: string;
  isAwait?: boolean; // Whether to await the handler, defaults to true
}

/**
 * Step that uses a registered Action with generic model type support.
 */
export interface ActionStepDefinition<TModel extends FlowModel = FlowModel> extends BaseStepDefinition<TModel> {
  use: string; // Name of the registered ActionDefinition
  uiSchema?: Record<string, ISchema>; // Optional: overrides uiSchema from ActionDefinition
  defaultParams?: Record<string, any>; // Optional: overrides/extends defaultParams from ActionDefinition
  // Cannot have its own handler
  handler?: undefined; 
}

/**
 * Step that defines its handler inline with generic model type support.
 */
export interface InlineStepDefinition<TModel extends FlowModel = FlowModel> extends BaseStepDefinition<TModel> {
  handler: (ctx: FlowContext, model: TModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>; // Optional: uiSchema for this inline step
  defaultParams?: Record<string, any>; // Optional: defaultParams for this inline step
  // Cannot use a registered action
  use?: undefined;
}

export type StepDefinition<TModel extends FlowModel = FlowModel> = 
  ActionStepDefinition<TModel> | InlineStepDefinition<TModel>;

/**
 * Context object passed to handlers during flow execution.
 */
export interface FlowContext {
  engine: FlowEngine; // Instance of the FlowEngine
  app?: Application; // Context can also have app reference
  event?: any; // Information about the triggering event, if applicable
  $exit: () => void;
  [key: string]: any; // Allow for additional custom context data
}

/**
 * User context for hooks - omitting internal engine properties
 */
export type UserContext = Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>;

/**
 * Action options for registering actions with generic model type support
 */
export interface ActionOptions<TModel extends FlowModel = FlowModel, P = any, R = any> {
  handler: (ctx: any, model: TModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
} 