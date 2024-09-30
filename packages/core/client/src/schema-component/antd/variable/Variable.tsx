/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import React, { createContext, useContext } from 'react';

import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
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

Variable.TextArea = withDynamicSchemaProps(connect(TextArea, mapReadPretty(TextArea.ReadPretty)));

Variable.RawTextArea = connect(RawTextArea);

Variable.JSON = connect(JSONInput);

export default Variable;
