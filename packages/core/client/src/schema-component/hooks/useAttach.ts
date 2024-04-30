/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRef, useEffect } from 'react';

interface IRecycleTarget {
  onMount: () => void;
  onUnmount: () => void;
}

export const useAttach = <T extends IRecycleTarget>(target: T): T => {
  const oldTargetRef = useRef<IRecycleTarget>(null);
  useEffect(() => {
    if (oldTargetRef.current && target !== oldTargetRef.current) {
      oldTargetRef.current.onUnmount();
    }
    oldTargetRef.current = target;
    target.onMount();
    return () => {
      target.onUnmount();
    };
  }, [target]);
  return target;
};
