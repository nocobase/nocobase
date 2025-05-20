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
) => T;

/**
 * Defines a reusable action.
 */
export interface ActionDefinition {
  name: string; // Unique identifier for the action
  title?: string;
  handler: (ctx: FlowContext, model: FlowModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>;
  defaultParams?: Record<string, any>;
}

/**
 * Defines a flow.
 */
export interface FlowDefinition {
  key: string; // Unique identifier for the flow
  title?: string;
  /**
   * Optional configuration to allow this flow to be triggered by `dispatchEvent`.
   */
  on?: {
    eventName: string;
  };
  steps: Record<string, StepDefinition>;
}

/**
 * Base interface for a step definition.
 */
interface BaseStepDefinition {
  title?: string;
  isAwait?: boolean; // Whether to await the handler, defaults to true
}

/**
 * Step that uses a registered Action.
 */
export interface ActionStepDefinition extends BaseStepDefinition {
  use: string; // Name of the registered ActionDefinition
  uiSchema?: Record<string, ISchema>; // Optional: overrides uiSchema from ActionDefinition
  defaultParams?: Record<string, any>; // Optional: overrides/extends defaultParams from ActionDefinition
  // Cannot have its own handler
  handler?: undefined; 
}

/**
 * Step that defines its handler inline.
 */
export interface InlineStepDefinition extends BaseStepDefinition {
  handler: (ctx: FlowContext, model: FlowModel, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema>; // Optional: uiSchema for this inline step
  defaultParams?: Record<string, any>; // Optional: defaultParams for this inline step
  // Cannot use a registered action
  use?: undefined;
}

export type StepDefinition = ActionStepDefinition | InlineStepDefinition;

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
 * Action options for registering actions
 */
export interface ActionOptions<P = any, R = any> {
  handler: (ctx: any, model: FlowModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
} 