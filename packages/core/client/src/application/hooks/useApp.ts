/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext } from 'react';
import type { Application } from '../Application';
import { ApplicationContext } from '../context';

export const useApp = () => {
  return useContext(ApplicationContext) || ({} as Application);
};
