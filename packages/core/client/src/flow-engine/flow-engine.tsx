import React from 'react';
import { observer } from '@formily/react';
import {
  ActionDefinition,
  FlowDefinition,
  ModelConstructor,
} from './types';
import { Application } from '../application';
import type { BaseFlowModel } from '@nocobase/client';
import { useApplyFlow, useFlowContext } from './hooks';

type FlowModelComponentProps<P extends React.ComponentProps<any>> = 
  {
    model: BaseFlowModel;
  } & P;

export class FlowEngine {
  private actions: Map<string, ActionDefinition> = new Map();
  private modelClasses: Map<string, ModelConstructor> = new Map();
  private modelInstances: Map<string, any> = new Map();
  private flows: Map<string, FlowDefinition> = new Map();

  // Public API is now for registration and retrieval of definitions/instances

  public registerAction(definition: ActionDefinition): void {
    if (this.actions.has(definition.name)) {
      console.warn(`FlowEngine: Action with name '${definition.name}' is already registered and will be overwritten.`);
    }
    this.actions.set(definition.name, definition);
  }

  public getAction(name: string): ActionDefinition | undefined {
    return this.actions.get(name);
  }

  public registerModelClass(name: string, modelClass: ModelConstructor): void {
    if (this.modelClasses.has(name)) {
      console.warn(`FlowEngine: Model class with name '${name}' is already registered and will be overwritten.`);
    }
    this.modelClasses.set(name, modelClass);
  }

  public getModelClass(name: string): ModelConstructor | undefined {
    return this.modelClasses.get(name);
  }

  public createModel<T extends BaseFlowModel = BaseFlowModel>(
    app: Application,
    modelClassName: string,
    uid: string,
  ): T {
    const ModelClass = this.getModelClass(modelClassName) as ModelConstructor<T>;
    if (!ModelClass) {
      throw new Error(`FlowEngine: Model class '${modelClassName}' not found.`);
    }
    if (this.modelInstances.has(uid)) {
      console.warn(`FlowEngine: Model instance with UID '${uid}' already exists. Returning existing instance.`);
      return this.modelInstances.get(uid) as T;
    }
    const modelInstance = new ModelClass(uid, app);
    this.modelInstances.set(uid, modelInstance);
    return modelInstance;
  }

  public getModel<T extends BaseFlowModel = BaseFlowModel>(uid: string): T | undefined {
    return this.modelInstances.get(uid) as T | undefined;
  }

  public destroyModel(uid: string): boolean {
    if (this.modelInstances.has(uid)) {
        return this.modelInstances.delete(uid);
    }
    return false;
  }
  
  public registerFlow(definition: FlowDefinition): void {
    if (this.flows.has(definition.key)) {
      console.warn(`FlowEngine: Flow with key '${definition.key}' is already registered and will be overwritten.`);
    }
    this.flows.set(definition.key, definition);
  }

  public getFlow(key: string): FlowDefinition | undefined {
    return this.flows.get(key);
  }

  public getFlows(): Map<string, FlowDefinition> {
    return this.flows;
  }

  public static withFlowModel<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: { defaultFlowKey: string; }
  ) {
    
    const EnhancedComponentInner = 
      observer((props: FlowModelComponentProps<P>) => {
        const { model, ...restPassthroughProps } = props;
        const flowContext = useFlowContext();
        useApplyFlow(model, options.defaultFlowKey, flowContext);

        const modelProps = model.getProps();
        const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

        return <WrappedComponent {...combinedProps} />;
    });

    EnhancedComponentInner.displayName = `WithFlowModel(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    return EnhancedComponentInner;
  }
} 