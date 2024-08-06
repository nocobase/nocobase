/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollection } from '../../data-source';

export const useActionAvailable = (actionKey) => {
  const collection = useCollection() || ({} as any);
  const { unavailableActions, availableActions } = collection?.options || {};
  if (availableActions) {
    return availableActions?.includes?.(actionKey);
  }
  if (unavailableActions) {
    return !unavailableActions?.includes?.(actionKey);
  }
  return true;
};
