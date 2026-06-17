/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable, observe } from '@nocobase/flow-engine';
import { useSyncExternalStore } from 'react';

type StateListener<TState extends object> = (state: TState, previousState: TState) => void;
type SelectorListener<TSelected> = (selectedState: TSelected, previousSelectedState: TSelected) => void;
type StoreUpdater<TState extends object> = Partial<TState> | TState | ((state: TState) => Partial<TState> | TState);

type StoreSetState<TState extends object> = (partial: StoreUpdater<TState>, replace?: boolean) => void;
type StoreGetState<TState extends object> = () => TState;
type StoreSubscribe<TState extends object> = {
  (listener: StateListener<TState>): () => void;
  <TSelected>(
    selector: (state: TState) => TSelected,
    listener: SelectorListener<TSelected>,
    options?: { equalityFn?: (left: TSelected, right: TSelected) => boolean; fireImmediately?: boolean },
  ): () => void;
};

export type ObservableStoreInitializer<TState extends object> = (
  set: StoreSetState<TState>,
  get: StoreGetState<TState>,
) => TState;

export type ObservableStore<TState extends object> = {
  <TSelected = TState>(selector?: (state: TState) => TSelected): TSelected;
  getState: StoreGetState<TState>;
  setState: StoreSetState<TState>;
  subscribe: StoreSubscribe<TState>;
  destroy: () => void;
  use: { [K in keyof TState]: () => TState[K] };
};

type WithSelectors<S> = S extends { getState: () => infer T extends object }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

type SelectableStore<TState extends object> = {
  <TSelected>(selector: (state: TState) => TSelected): TSelected;
  getState: () => TState;
  use?: Record<string, () => unknown>;
};

export const createObservableStore = <TState extends object>(
  initializer: ObservableStoreInitializer<TState>,
): ObservableStore<TState> => {
  let state: TState | undefined;
  const listeners = new Set<StateListener<TState>>();
  let disposeObservation: (() => void) | undefined;

  const getState: StoreGetState<TState> = () => {
    if (!state) {
      throw new Error('Observable store is not initialized yet.');
    }
    return state;
  };

  const setObservedState = (nextState: TState) => {
    disposeObservation?.();
    state = observable.shallow(nextState) as TState;
    disposeObservation = observe(state, () => {
      notify({ ...getState() });
    });
  };

  const notify = (previousState: TState) => {
    const currentState = getState();
    for (const listener of Array.from(listeners)) {
      listener(currentState, previousState);
    }
  };

  const setState: StoreSetState<TState> = (partial, replace) => {
    const currentState = getState();
    const nextState = typeof partial === 'function' ? partial(currentState) : partial;
    setObservedState((replace ? nextState : { ...currentState, ...nextState }) as TState);
    notify(currentState);
  };

  setObservedState(initializer(setState, getState));

  const subscribe: StoreSubscribe<TState> = <TSelected>(
    listenerOrSelector: StateListener<TState> | ((state: TState) => TSelected),
    listener?: SelectorListener<TSelected>,
    options?: { equalityFn?: (left: TSelected, right: TSelected) => boolean; fireImmediately?: boolean },
  ) => {
    if (!listener) {
      const stateListener = listenerOrSelector as StateListener<TState>;
      listeners.add(stateListener);
      return () => {
        listeners.delete(stateListener);
      };
    }

    const selector = listenerOrSelector as (state: TState) => TSelected;
    const equalityFn = options?.equalityFn ?? Object.is;
    let selectedState = selector(getState());
    const stateListener: StateListener<TState> = (nextState) => {
      const nextSelectedState = selector(nextState);
      if (equalityFn(selectedState, nextSelectedState)) {
        return;
      }
      const previousSelectedState = selectedState;
      selectedState = nextSelectedState;
      listener(nextSelectedState, previousSelectedState);
    };

    listeners.add(stateListener);
    if (options?.fireImmediately) {
      listener(selectedState, selectedState);
    }

    return () => {
      listeners.delete(stateListener);
    };
  };

  const store = (<TSelected = TState>(selector?: (state: TState) => TSelected) =>
    useSyncExternalStore(
      (listener) =>
        subscribe(() => {
          listener();
        }),
      () => (selector ? selector(getState()) : (getState() as unknown as TSelected)),
      () => (selector ? selector(getState()) : (getState() as unknown as TSelected)),
    )) as ObservableStore<TState>;

  store.getState = getState;
  store.setState = setState;
  store.subscribe = subscribe;
  store.destroy = () => {
    disposeObservation?.();
    listeners.clear();
  };
  store.use = {} as ObservableStore<TState>['use'];

  return createSelectors(store);
};

export const createSelectors = <TState extends object, S extends SelectableStore<TState>>(_store: S) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {} as WithSelectors<typeof _store>['use'];
  for (const k of Object.keys(store.getState())) {
    (store.use as Record<string, () => unknown>)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};
