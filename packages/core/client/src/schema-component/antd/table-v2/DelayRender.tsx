/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React, { FC, startTransition, useEffect, useState } from 'react';
import { useKeepAlive } from '../../../route-switch/antd/admin-layout/KeepAlive';

const queue = new Set<(value: boolean) => void>();

const getNext = (setHidden: (value: boolean) => void) => {
  const iterator = queue.values();
  let current = iterator.next();
  while (current.value !== setHidden) {
    current = iterator.next();
  }
  return iterator.next();
};

/**
 * Render children after other components to prevent jank and improve user experience
 */
export const DelayRender: FC = ({ children }) => {
  const [hidden, setHidden] = useState(!_.isEmpty(queue));
  useState(() => {
    queue.add(setHidden);
  });
  const { active: pageActive } = useKeepAlive();

  useEffect(() => {
    // Only render when the page is active
    if (!hidden && pageActive) {
      startTransition(() => {
        const next = getNext(setHidden);
        queue.delete(setHidden);
        if (next?.value) {
          next.value(false);
        }
      });
    }
  }, [hidden, pageActive]);

  if (hidden) {
    return null;
  }

  return <>{children}</>;
};
