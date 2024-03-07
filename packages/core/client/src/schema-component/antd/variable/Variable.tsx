import { connect, mapReadPretty } from '@formily/react';
import React, { createContext, useContext } from 'react';

import { Input } from './Input';
import { JSONInput } from './JSONInput';
import { RawTextArea } from './RawTextArea';
import { TextArea } from './TextArea';

const VariableScopeContext = createContext([]);
VariableScopeContext.displayName = 'VariableScopeContext';

export function VariableScopeProvider({ scope = [], children }) {
  return <VariableScopeContext.Provider value={scope}>{children}</VariableScopeContext.Provider>;
}

export function useVariableScope() {
  return useContext(VariableScopeContext);
}

export function Variable() {
  return null;
}

Variable.Input = connect(Input);

Variable.TextArea = connect(TextArea, mapReadPretty(TextArea.ReadPretty));

Variable.RawTextArea = connect(RawTextArea);

Variable.JSON = connect(JSONInput);

export default Variable;
