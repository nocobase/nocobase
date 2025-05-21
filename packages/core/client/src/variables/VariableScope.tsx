import React, { createContext, FC, useMemo } from "react"

const VariableScopeContext = createContext({})

export const VariableScope: FC<{ scopeId: string }> = (props) => {
  const value = useMemo(() => {
    return {
      scopeId: props.scopeId,
    }
  }, [props.scopeId])
  return <VariableScopeContext.Provider value={value}></VariableScopeContext.Provider>
}

export const useVariableScope = () => {
  const context = React.useContext(VariableScopeContext)
  return context
}
