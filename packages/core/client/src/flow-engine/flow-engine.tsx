import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { observer } from '@formily/react';
import {
  ActionDefinition,
  FlowDefinition,
  ModelConstructor,
  FlowContext,
} from './types';
import { Application } from '../application';
import { FlowModel } from '@nocobase/client';
import { useFlowEngine } from './provider';
import { useApp } from '@nocobase/client';
import { autorun, toJS } from '@formily/reactive';

// --- Cache for Suspense-enabled hooks ---
interface FlowCacheEntry {
  status: 'pending' | 'resolved' | 'rejected';
  promise: Promise<any>;
  data?: any;
  error?: any;
}

const flowEngineCache = new Map<string, FlowCacheEntry>();

// Context for useApplyFlow and useDispatchEvent should not include engine or $exit or app
type UserContext = Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>;

export interface ActionOptions<P = any, R = any> {
  handler: (ctx: any, model: FlowModel, params: P) => Promise<R> | R;
  uiSchema?: Record<string, any>;
  defaultParams?: Partial<P>;
}

// Helper to generate a stable cache key
function generateCacheKey(prefix: string, flowKey: string, modelUid: string, context?: UserContext): string {
  const contextString = context ? safeStringify(context) : '';
  
  return `${prefix}:${flowKey}:${modelUid}:${contextString}`;
}

function safeStringify(obj: any, visited = new Set(), depth = 0, maxDepth = 5): string {
  // 深度限制，防止过深递归
  if (depth > maxDepth) {
    return '[MaxDepthExceeded]';
  }

  // 处理基本类型
  if (obj === null || obj === undefined) {
    return String(obj);
  }

  if (typeof obj !== 'object' && typeof obj !== 'function') {
    return String(obj);
  }

  // 处理函数
  if (typeof obj === 'function') {
    // 对于函数，可以使用函数名或为匿名函数生成一个标识符
    return `function:${obj.name || 'anonymous'}`;
  }

  // 处理循环引用
  if (visited.has(obj)) {
    return '[Circular]';
  }

  // 添加到已访问集合
  visited.add(obj);

  // 处理数组
  if (Array.isArray(obj)) {
    try {
      // 限制处理的数组元素数量
      const maxItems = 100;
      const items = obj.slice(0, maxItems);
      const result = '[' + items.map(item => safeStringify(item, visited, depth + 1, maxDepth)).join(',') + 
        (obj.length > maxItems ? ',...' : '') + ']';
      return result;
    } catch (e) {
      return '[Array]';
    }
  }

  // 处理普通对象
  try {
    const keys = Object.keys(obj).sort(); // 排序确保稳定性
    // 限制处理的属性数量
    const maxKeys = 50;
    const limitedKeys = keys.slice(0, maxKeys);

    const pairs = limitedKeys.map(key => {
      const value = obj[key];
      return `${key}:${safeStringify(value, visited, depth + 1, maxDepth)}`;
    });

    return '{' + pairs.join(',') + (keys.length > maxKeys ? ',...' : '') + '}';
  } catch (e) {
    // 如果无法序列化，返回一个简单的标识
    return '[Object]';
  }
}
// --- End Cache ---

type FlowModelComponentProps<P extends React.ComponentProps<any>> = 
  {
    model: FlowModel;
  } & P;

export class FlowEngine {
  private actions: Map<string, ActionDefinition> = new Map();
  private modelClasses: Map<string, ModelConstructor> = new Map();
  private modelInstances: Map<string, any> = new Map();
  private flows: Map<string, FlowDefinition> = new Map();

  // Public API is now for registration and retrieval of definitions/instances

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

  public static useContext(): FlowContext {
    const engine = useFlowEngine();
    const app = useApp();
    // TODO: add more context here
    const context = useMemo(() => ({
      engine,
      app,
    } as FlowContext), [engine, app]);
    return context;
  }

  public static useModelById<T extends FlowModel = FlowModel>(
    uid: string,
    modelClassName?: string,
  ): T {
    const engine = useFlowEngine();
    const app = useApp();

    const model = useMemo(() => {
      let instance = engine.getModel<T>(uid);
      if (!instance && modelClassName) {
        instance = engine.createModel<T>(uid, modelClassName, app);
      }
      return instance;
    }, [engine, app, modelClassName, uid]);
    return model;
  }

  public static useApplyFlow(
    flowKey: string,
    model: FlowModel,
    context?: UserContext,
  ): any {
    const engine = useFlowEngine();
    const cacheKey = useMemo(() => generateCacheKey('applyFlow', flowKey, model.uid, context), [flowKey, model.uid, context]);
    const [, forceUpdate] = useState({});
    const isMounted = useRef(true);

    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
      let debounceTimer: NodeJS.Timeout | null = null;
      let isInitialAutorunForEffect = true;

      const disposeAutorun = autorun(async () => {
        JSON.stringify(toJS(model.props));
        JSON.stringify(toJS(model.stepParams));

        if (isInitialAutorunForEffect) {
          isInitialAutorunForEffect = false;
          return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          if (!isMounted.current) return;

          const cachedEntry = flowEngineCache.get(cacheKey);
          if (cachedEntry?.status === 'resolved' || !cachedEntry) {
            console.log(`[FlowEngine.useApplyFlow] Reactive re-apply for flow: ${flowKey}, model: ${model.uid}`);
            try {
              const executionUserContext = context;
              const newResult = await model.applyFlow(flowKey, executionUserContext);
              if (isMounted.current) {
                flowEngineCache.set(cacheKey, { status: 'resolved', data: newResult, promise: Promise.resolve(newResult) });
                forceUpdate({});
              }
            } catch (newError) {
              if (isMounted.current) {
                flowEngineCache.set(cacheKey, { status: 'rejected', error: newError, promise: Promise.reject(newError) });
                forceUpdate({});
              }
            }
          }
        }, 300);
      });

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        disposeAutorun();
      };
    }, [model, flowKey, context, cacheKey, engine]);

    const cachedEntry = flowEngineCache.get(cacheKey);
    if (cachedEntry) {
      if (cachedEntry.status === 'resolved') return cachedEntry.data;
      if (cachedEntry.status === 'rejected') throw cachedEntry.error;
      if (cachedEntry.status === 'pending') throw cachedEntry.promise;
    }

    const initialUserContext = context;
    const promise = model.applyFlow(flowKey, initialUserContext)
      .then(result => {
        if(isMounted.current) flowEngineCache.set(cacheKey, { status: 'resolved', data: result, promise });
        return result;
      })
      .catch(err => {
        if(isMounted.current) flowEngineCache.set(cacheKey, { status: 'rejected', error: err, promise });
        throw err;
      });

    flowEngineCache.set(cacheKey, { status: 'pending', promise });
    throw promise;
  }

  public static useDispatchEvent(
    eventName: string,
    model: FlowModel,
    context?: UserContext
  ) {
    const dispatch = useCallback(() => {
      model.dispatchEvent(eventName, context);
    }, [model, eventName, context]);
    return { dispatch };
  }

  public static withFlowModel<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options: { defaultFlow?: string; }
  ) {
    const defaultFlowKey = options.defaultFlow || '';

    // 根据是否提供 defaultFlow 选择不同的增强组件
    if (defaultFlowKey) {
      // 带有默认 flow 的增强组件
      const WithFlowModelAndApply = observer((props: FlowModelComponentProps<P>) => {
        const { model, ...restPassthroughProps } = props;
        const flowContext = FlowEngine.useContext();
        // 始终应用默认流程
        FlowEngine.useApplyFlow(defaultFlowKey, model, flowContext as UserContext);

        const modelProps = model.getProps();
        const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

        return <WrappedComponent {...combinedProps} />;
      });

      WithFlowModelAndApply.displayName = `WithFlowModelAndApply(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
      return WithFlowModelAndApply;
    } else {
      // 不带默认 flow 的简单增强组件
      const WithFlowModelOnly = observer((props: FlowModelComponentProps<P>) => {
        const { model, ...restPassthroughProps } = props;
        const modelProps = model.getProps();
        const combinedProps = { ...restPassthroughProps, ...modelProps } as unknown as P;

        return <WrappedComponent {...combinedProps} />;
      });

      WithFlowModelOnly.displayName = `WithFlowModelOnly(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
      return WithFlowModelOnly;
    }
  }
} 