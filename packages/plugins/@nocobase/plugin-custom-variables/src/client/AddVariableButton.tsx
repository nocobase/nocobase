/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC } from 'react';
import { useSchemaInitializerRender, useToken, useVariableScopeInfo } from '@nocobase/client';

const AddVariableButtonContext = createContext<{ onSuccess: () => void }>({
  onSuccess: () => {},
});

export const AddVariableButton: FC<{ onSuccess?: () => void }> = (props) => {
  const { token } = useToken();
  const { getVariableScopeInfo } = useVariableScopeInfo();
  const { scopeId } = getVariableScopeInfo();
  const { render } = useSchemaInitializerRender(
    'customVariables:addVariable',
    scopeId ? { designable: true } : undefined,
  );

  if (!scopeId) {
    return null;
  }

  return (
    <AddVariableButtonContext.Provider value={{ onSuccess: props.onSuccess || (() => {}) }}>
      {render({ style: { borderRadius: token.borderRadius } })}
    </AddVariableButtonContext.Provider>
  );
};

export const useAddVariableButtonProps = () => {
  return React.useContext(AddVariableButtonContext);
};
