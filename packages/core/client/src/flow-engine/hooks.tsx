import { useEffect, useMemo, useState, useRef } from 'react';
import { useFlowEngine } from './provider';
import type { BaseModel } from '@nocobase/client';
import type { FlowContext } from './types';
import { autorun, toJS } from '@formily/reactive';
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
  return model;
}

/**
 * Hook to apply a flow on a model instance, supporting React Suspense.
 * Reactively re-applies the flow if model.props or model.stepParams change.
 */
export function useApplyFlow(
  model: BaseModel, 
  flowKey: string,
  context?: UserContext, 
): any { 
  const engine = useFlowEngine(); // Still needed for the executionContext for model.applyFlow
  const cacheKey = useMemo(() => generateCacheKey('applyFlow', flowKey, model.uid, context), [flowKey, model.uid, context]);
  const [, forceUpdate] = useState({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Effect for reactive re-application due to model changes
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;
    let isInitialAutorunForEffect = true;

    const disposeAutorun = autorun(async () => {
      // Track dependencies for re-running the flow
      // These are the same dependencies that should cause a component using this model to re-render
      JSON.stringify(toJS(model.props)); // Track all props
      JSON.stringify(toJS(model.stepParams)); // Track all stepParams
      // model.hidden; // if hidden state should also trigger re-application

      if (isInitialAutorunForEffect) {
        isInitialAutorunForEffect = false;
        return; // Don't re-fetch on the very first autorun trigger by this effect's setup
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (!isMounted.current) return;

        const cachedEntry = flowEngineCache.get(cacheKey);
        // Only re-fetch if the flow was previously resolved. 
        // If it was pending/errored, the main suspense logic will handle it upon next render triggered by model change.
        if (cachedEntry?.status === 'resolved' || !cachedEntry) { // Or if not cached yet (e.g. context changed, then model internal change)
          console.log(`[useApplyFlow] Reactive re-apply for flow: ${flowKey}, model: ${model.uid}`);
          try {
            // The context for model.applyFlow doesn't include engine, app, $exit
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
      }, 300); // Debounce
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      disposeAutorun();
    };
  // model, flowKey, context, cacheKey, engine are dependencies for re-subscribing autorun if hook params change
  // The model object itself changing would re-run this whole effect.
  // Internal changes to model.props/stepParams are caught by autorun.
  }, [model, flowKey, context, cacheKey, engine]);


  // Initial Suspense data fetching logic
  const cachedEntry = flowEngineCache.get(cacheKey);
  if (cachedEntry) {
    if (cachedEntry.status === 'resolved') return cachedEntry.data;
    if (cachedEntry.status === 'rejected') throw cachedEntry.error;
    if (cachedEntry.status === 'pending') throw cachedEntry.promise; 
  }

  // The context for model.applyFlow doesn't include engine, app, $exit
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

/**
 * Hook to dispatch an event from a model instance.
 */
export function useDispatchEvent(
  model: BaseModel, // Model is now required
  eventName: string,
) {
  if (!model.flowEngine) {
    console.warn('FlowEngine not available on the provided model for useDispatchEvent. Dispatch might not work as expected.');
  }

  const dispatch = (context?: UserContext) => {
    model.dispatchEvent(eventName, context);
  };

  return { dispatch };
}

/**
 * Hook to get the flow context.
 * @returns The flow context.
 */
export function useFlowContext() {
  const engine = useFlowEngine();
  const app = useApp(); 
  // TODO: add more context here
  const context = useMemo(() => ({
    engine,
    app,
  }), [engine, app]);
  return context;
}

