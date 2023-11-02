import React, { createContext, useReducer } from 'react';

export interface CounterContextState {
  count: number;
}

const initialState: CounterContextState = {
  count: 0,
};

const reducer = (state: CounterContextState, action: { type: string; payload?: any }) => {
  switch (action.type) {
    case 'SUBMIT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
};

export const CounterContext = createContext<{
  state: CounterContextState;
  dispatch: React.Dispatch<{ type: string; payload?: number }>;
}>({
  state: initialState,
  dispatch: () => {},
});
