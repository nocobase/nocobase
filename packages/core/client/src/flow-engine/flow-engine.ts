import {
  ActionDefinition,
  FlowDefinition,
  ModelConstructor,
  ActionOptions
} from './types';
import { Application } from '../application';
import { FlowModel } from '@nocobase/client';

// 导入hooks和HOC
import { useContext } from './hooks/useContext';
import { useModelById } from './hooks/useModelById';
import { useApplyFlow } from './hooks/useApplyFlow'; 
import { useDispatchEvent } from './hooks/useDispatchEvent';
import { withFlowModel } from './withFlowModel';

export class FlowEngine {
  // 静态方法直接从hooks和HOC模块导入
  public static useContext = useContext;
  public static useModelById = useModelById;
  public static useApplyFlow = useApplyFlow;
  public static useDispatchEvent = useDispatchEvent;
  public static withFlowModel = withFlowModel;

  private actions: Map<string, ActionDefinition> = new Map();
  private modelClasses: Map<string, ModelConstructor> = new Map();
  private modelInstances: Map<string, any> = new Map();
  private flows: Map<string, FlowDefinition> = new Map();

  public registerAction(nameOrDefinition: string | ActionDefinition, options?: ActionOptions): void {
    let definition: ActionDefinition;
    
    if (typeof nameOrDefinition === 'string' && options) {
      definition = {
        ...options,
        name: nameOrDefinition,
      };
    } else if (typeof nameOrDefinition === 'object') {
      definition = nameOrDefinition as ActionDefinition;
    } else {
      throw new Error('Invalid arguments for registerAction');
    }
    
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

  public createModel<T extends FlowModel = FlowModel>(
    uid: string,
    modelClassName: string,
    app: Application,
  ): T {
    const ModelClass = (this.getModelClass(modelClassName) || FlowModel) as ModelConstructor<T>;
    if (this.modelInstances.has(uid)) {
      console.warn(`FlowEngine: Model instance with UID '${uid}' already exists. Returning existing instance.`);
      return this.modelInstances.get(uid) as T;
    }
    const modelInstance = new ModelClass(uid, app);
    this.modelInstances.set(uid, modelInstance);
    return modelInstance;
  }

  public getModel<T extends FlowModel = FlowModel>(uid: string): T | undefined {
    return this.modelInstances.get(uid) as T | undefined;
  }

  public destroyModel(uid: string): boolean {
    if (this.modelInstances.has(uid)) {
        return this.modelInstances.delete(uid);
    }
    return false;
  }
  
  public registerFlow(keyOrDefinition: string | FlowDefinition, flowDefinition?: FlowDefinition): void {
    let definition: FlowDefinition;
    let key: string;
    
    if (typeof keyOrDefinition === 'string' && flowDefinition) {
      key = keyOrDefinition;
      definition = {
        ...flowDefinition,
        key
      };
    } else if (typeof keyOrDefinition === 'object' && 'key' in keyOrDefinition) {
      key = keyOrDefinition.key;
      definition = keyOrDefinition;
    } else {
      throw new Error('Invalid arguments for registerFlow');
    }
    
    if (this.flows.has(key)) {
      console.warn(`FlowEngine: Flow with key '${key}' is already registered and will be overwritten.`);
    }
    this.flows.set(key, definition);
  }

  public getFlow(key: string): FlowDefinition | undefined {
    return this.flows.get(key);
  }

  public getFlows(): Map<string, FlowDefinition> {
    return this.flows;
  }
} 