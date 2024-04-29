/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ObjectField } from '@formily/core';
import { Schema } from '@formily/react';
import { createContext } from 'react';

export interface FilterContextProps {
  field?: ObjectField;
  fieldSchema?: Schema;
  dynamicComponent?: any;
  options?: any[];
  disabled?: boolean;
}

export const RemoveActionContext = createContext(null);
RemoveActionContext.displayName = 'RemoveActionContext';
export const FilterContext = createContext<FilterContextProps>(null);
FilterContext.displayName = 'FilterContext';
export const LinkageLogicContext = createContext(null);
LinkageLogicContext.displayName = 'LinkageLogicContext';
