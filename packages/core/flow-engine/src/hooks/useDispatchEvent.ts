/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback } from 'react';
import { FlowModel } from '../models';

export function useDispatchEvent(eventName: string, model: FlowModel, inputArgs?: Record<string, any>) {
  const dispatch = useCallback(() => {
    model.dispatchEvent(eventName, inputArgs);
  }, [model, eventName, inputArgs]);

  return { dispatch };
}
