import { useEffect, useMemo, useState } from 'react';
import { useFlowEngine } from './provider';
import type { BaseModel } from '@nocobase/client';
import type { FlowContext } from './types';
import { autorun } from '@formily/reactive';
import stableStringify from 'fast-json-stable-stringify';
import { useApp } from '@nocobase/client';

// --- Cache for Suspense-enabled hooks ---
interface FlowCacheEntry {
  status: 'pending' | 'resolved' | 'rejected';
  promise: Promise<any>;
  data?: any;
  error?: any; // Can be Error or other types depending on what executeFlow rejects with
}

const flowEngineCache = new Map<string, FlowCacheEntry>();

// Context for useApplyFlow and useDispatchEvent should not include engine or $exit
type UserContext = Partial<Omit<FlowContext, 'engine' | '$exit' | 'app'>>;

// Helper to generate a stable cache key
function generateCacheKey(prefix: string, flowKey: string, modelUid: string, context?: UserContext): string {
  const contextString = context ? stableStringify(context) : '';
  return `${prefix}:${flowKey}:${modelUid}:${contextString}`;
}
// --- End Cache ---

/**
 * Hook to get or create a model instance from the FlowEngine.
 * The model's properties are made reactive to the component.
 * 
 * @param modelClassName The registered name of the model class.
 * @param uid Unique identifier for the model instance.
 * @returns The model instance.
 */
export function useModel<T extends BaseModel = BaseModel>(
  modelClassName: string,
  uid: string,
): T {
  const engine = useFlowEngine();
  const app = useApp();

  // Get or create the model instance. This part is memoized by engine itself if instance exists.
  const model = useMemo(() => {
    let instance = engine.getModel<T>(uid);
    if (!instance) {
      instance = engine.createModel<T>(app, modelClassName, uid);
    }
    return instance;
  }, [engine, app, modelClassName, uid]);
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const dispose = autorun(() => {
      // Access observable properties to track them
      // This will re-run autorun when any of these change, then forceUpdate re-renders component.
      Object.keys(model.props).forEach(key => model.props[key]);
      model.hidden; // track hidden state
      model.stepParams; // track stepParams
      forceUpdate({});
    });
    return () => {
      dispose();
    };
  }, [model]);
  return model;
}

/**
 * Hook to apply a flow on a model instance, supporting React Suspense.
 * The component will suspend if the flow execution is pending.
 * Throws an error for Error Boundaries if the flow execution fails.
 */
export function useApplyFlow(
  model: BaseModel, // Model is now required
  flowKey: string,
  context?: UserContext, 
): any { 
  // Engine is obtained from the model instance
  if (!model.flowEngine) {
    throw new Error('FlowEngine not available on the provided model for useApplyFlow. Ensure model is created via FlowEngine or app is set.');
  }

  // Cache key now definitely uses model.uid
  const cacheKey = useMemo(() => generateCacheKey('applyFlow', flowKey, model.uid, context), [flowKey, model.uid, context]);
  const cachedEntry = flowEngineCache.get(cacheKey);

  if (cachedEntry) {
    if (cachedEntry.status === 'resolved') return cachedEntry.data;
    if (cachedEntry.status === 'rejected') throw cachedEntry.error;
    if (cachedEntry.status === 'pending') throw cachedEntry.promise; 
  }

  const promise = model.applyFlow(flowKey, context) // model.applyFlow handles context correctly
    .then(result => {
      flowEngineCache.set(cacheKey, { status: 'resolved', data: result, promise });
      return result;
    })
    .catch(err => {
      flowEngineCache.set(cacheKey, { status: 'rejected', error: err, promise });
      throw err;
    });

  flowEngineCache.set(cacheKey, { status: 'pending', promise });
  throw promise;
}

/**
 * Hook to dispatch an event from a model instance.
 */
export function useDispatchEvent(
  model: BaseModel, // Model is now required
  eventName: string,
) {
  if (!model.flowEngine) {
    // Though model.dispatchEvent handles this, good to be explicit in hook if it relies on it.
    console.warn('FlowEngine not available on the provided model for useDispatchEvent. Dispatch might not work as expected.');
  }

  const dispatch = (context?: UserContext) => { // runtimeContext is now just context
    model.dispatchEvent(eventName, context); // model.dispatchEvent handles context correctly
  };

  return { dispatch };
}
