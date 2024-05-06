/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaOptionsContext } from '@formily/react';
import { get } from 'lodash';
import { useContext } from 'react';

export const useComponent = (component: any, defaults?: any) => {
  const { components } = useContext(SchemaOptionsContext);
  if (!component) {
    return defaults;
  }
  if (typeof component !== 'string') {
    return component;
  }
  return get(components, component) || defaults;
};
