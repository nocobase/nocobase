import React, { createContext, FC, useCallback, useMemo } from "react"

export const VariableScopeContext = createContext<{ scopeId: string; type: string; parent?: any }>({ scopeId: '', type: '' })

export const VariableScope: FC<{ scopeId: string; type: string }> = (props) => {
  const parent = React.useContext(VariableScopeContext);
  const value = useMemo(() => {
    return {
      scopeId: props.scopeId,
      type: props.type,
      parent,
    }
  }, [props.scopeId, props.type, parent])
  return <VariableScopeContext.Provider value={value}>{props.children}</VariableScopeContext.Provider>
}

export const useVariableScopeInfo = () => {
  let context = React.useContext(VariableScopeContext)
  return {
    getVariableScopeInfo: useCallback(() => {
      if (context.scopeId) return context;
      while (context.parent && !context.scopeId) {
        context = context.parent;
      }
      return context;
    }, [context]),
  }
}
