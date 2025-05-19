import { observable, action, define } from '@formily/reactive';
import { FlowEngine } from '../../flow-engine/flow-engine';
import type { FlowContext, ActionStepDefinition, InlineStepDefinition, StepDefinition } from '../../flow-engine/types';
import type { Application } from '../../application/Application';

export interface IModelComponentProps {
  [key: string]: any;
}

// 定义只读版本的props类型
export type ReadonlyModelProps = Readonly<IModelComponentProps>;

export class FlowModel {
  public readonly uid: string;
  public props: IModelComponentProps;
  public hidden: boolean;
  public stepParams: Record<string, Record<string, any>>;
  public app: Application;

  constructor(
    uid: string,
    app: Application,
  ) {
    this.uid = uid;
    this.props = {};
    this.hidden = false;
    this.stepParams = {};
    this.app = app;

    define(this, {
      props: observable,
      hidden: observable,
      stepParams: observable.deep,
      setProps: action,
      setStepParams: action,
      setHidden: action,
    });
  }

  get flowEngine(): FlowEngine | undefined {
    if (this.app && this.app.flowEngine) {
      if (this.app.flowEngine instanceof FlowEngine) {
        return this.app.flowEngine;
      }
      // Duck typing with type assertion to any for property access
      if (typeof this.app.flowEngine === 'object' && 
          this.app.flowEngine !== null &&
          typeof (this.app.flowEngine as any).getFlow === 'function' &&  
          typeof (this.app.flowEngine as any).getAction === 'function') {
        console.warn(`[BaseModel uid: ${this.uid}] flowEngine getter: this.app.flowEngine is not an instanceof FlowEngine, but seems to have core methods. Module identity issue?`);
        return this.app.flowEngine as FlowEngine;
      }
    }
    return undefined;
  }

  setProps(props: IModelComponentProps): void;
  setProps(key: string, value: any): void;
  setProps(props: IModelComponentProps | string, value?: any): void {
    if (typeof props === 'string') {
      this.props[props] = value;
    } else {
      this.props = { ...props };
    }
  }

  getProps(): ReadonlyModelProps {
    return this.props as ReadonlyModelProps;
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
  }

  setStepParams(flowKey: string, stepKey: string, params: any): void;
  setStepParams(flowKey: string, stepsParams: Record<string, any>): void;
  setStepParams(allParams: Record<string, Record<string, any>>): void;
  setStepParams(
    flowKeyOrAllParams: string | Record<string, Record<string, any>>,
    stepKeyOrStepsParams?: string | Record<string, any>,
    params?: any,
  ): void {
    if (typeof flowKeyOrAllParams === 'string') {
      const flowKey = flowKeyOrAllParams;
      if (typeof stepKeyOrStepsParams === 'string' && params !== undefined) {
        if (!this.stepParams[flowKey]) {
          this.stepParams[flowKey] = {};
        }
        this.stepParams[flowKey][stepKeyOrStepsParams] = params;
      } else if (typeof stepKeyOrStepsParams === 'object' && stepKeyOrStepsParams !== null) {
        this.stepParams[flowKey] = { ...(this.stepParams[flowKey] || {}), ...stepKeyOrStepsParams };
      }
    } else if (typeof flowKeyOrAllParams === 'object' && flowKeyOrAllParams !== null) {
      for (const fk in flowKeyOrAllParams) {
        if (Object.prototype.hasOwnProperty.call(flowKeyOrAllParams, fk)) {
          this.stepParams[fk] = { ...(this.stepParams[fk] || {}), ...flowKeyOrAllParams[fk] };
        }
      }
    }
  }

  getStepParams(flowKey: string, stepKey: string): any | undefined;
  getStepParams(flowKey: string): Record<string, any> | undefined;
  getStepParams(): Record<string, Record<string, any>>;
  getStepParams(flowKey?: string, stepKey?: string): any {
    if (flowKey && stepKey) {
      return this.stepParams[flowKey]?.[stepKey];
    }
    if (flowKey) {
      return this.stepParams[flowKey];
    }
    return this.stepParams;
  }

  async applyFlow(flowKey: string, context?: Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>): Promise<any> {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine || !this.app) {
      console.warn('FlowEngine or Application not available on this model for applyFlow. Check model.app and model.app.flowEngine setup.');
      return Promise.reject(new Error('FlowEngine or Application not available for applyFlow'));
    }
    
    const flow = currentFlowEngine.getFlow(flowKey);
    if (!flow) {
      console.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    let lastResult: any;
    let exited = false;
    const exitFlow = () => { exited = true; console.log(`Flow '${flowKey}' on model '${this.uid}' exited via ctx.$exit().`); };

    const baseContextForSteps: Omit<FlowContext, '$exit'> = {
      engine: currentFlowEngine,
      app: this.app,
      ...(context || {}),
    };

    for (const stepKey in flow.steps) {
      if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
        const step: StepDefinition = flow.steps[stepKey];
        if (exited) break;

        const stepContext: FlowContext = { ...baseContextForSteps, $exit: exitFlow } as FlowContext;
        
        let handler: ((ctx: FlowContext, model: FlowModel, params: any) => Promise<any> | any) | undefined;
        let combinedParams: Record<string, any> = {};
        let actionDefinition;

        if ((step as ActionStepDefinition).use) {
          const actionStep = step as ActionStepDefinition;
          actionDefinition = currentFlowEngine.getAction(actionStep.use);
          if (!actionDefinition) {
            console.error(`BaseModel.applyFlow: Action '${actionStep.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`);
            continue;
          }
          handler = actionDefinition.handler;
          combinedParams = { ...actionDefinition.defaultParams, ...actionStep.defaultParams };
        } else if ((step as InlineStepDefinition).handler) {
          const inlineStep = step as InlineStepDefinition;
          handler = inlineStep.handler;
          combinedParams = { ...inlineStep.defaultParams };
        } else {
          console.error(`BaseModel.applyFlow: Step '${stepKey}' in flow '${flowKey}' has neither 'use' nor 'handler'. Skipping.`);
          continue;
        }

        const modelStepParams = this.getStepParams(flowKey, stepKey);
        if (modelStepParams !== undefined) {
          combinedParams = { ...combinedParams, ...modelStepParams };
        }

        try {
          const currentStepResult = handler!(stepContext, this, combinedParams);
          if (step.isAwait !== false) {
            lastResult = await currentStepResult;
          } else {
            lastResult = currentStepResult;
          }
        } catch (error) {
          console.error(`BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`, error);
          return Promise.reject(error);
        }
      }
    }
    return Promise.resolve(lastResult);
  }

  dispatchEvent(eventName: string, context?: Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>): void {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine || !this.app) {
      console.warn('FlowEngine or Application not available on this model for dispatchEvent. Check model.app and model.app.flowEngine setup.');
      return;
    }
    const flows = currentFlowEngine.getFlows();

    const baseContextForFlow: Omit<FlowContext, '$exit'> = {
        engine: currentFlowEngine,
        app: this.app,
        event: { name: eventName, modelUid: this.uid },
        ...(context || {}),
    };

    flows.forEach((flow) => {
      if (flow.on && flow.on.eventName === eventName) {
        console.log(`BaseModel '${this.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
        this.applyFlow(flow.key, baseContextForFlow as any).catch(error => {
          console.error(`BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`, error);
        });
      }
    });
  }
} 