/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

export const VerificationTypeContext = createContext<{
  type: string;
}>({ type: '' });
VerificationTypeContext.displayName = 'VerificationTypeContext';

export const VerificationTypesContext = createContext<{
  types: {
    key: string;
    label: string;
    value: string;
  }[];
}>({ types: [] });
VerificationTypesContext.displayName = 'VerificationTypesContext';

export const useVerificationTypes = () => {
  const { types } = useContext(VerificationTypesContext);
  return types;
};
