/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

export const useLoadMoreObserver = ({
  loadMore,
}: {
  loadMore: () => void; // callback
}) => {
  const [lastItem, setLastItem] = useState<React.RefObject<any>>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const observeExposure = useCallback(
    (lastItem: React.RefObject<any>) => {
      if (!lastItem) {
        return;
      }
      observer.current && observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== lastItem.current) {
            return;
          }
          if (entry.isIntersecting) {
            observer.current && observer.current.unobserve(lastItem.current);
            loadMore();
          }
        });
      });

      lastItem.current && observer.current && observer.current.observe(lastItem.current);
    },
    [loadMore],
  );

  useEffect(() => {
    observeExposure(lastItem);

    return () => {
      observer.current && observer.current.disconnect();
    };
  }, [lastItem, observeExposure]);

  return {
    lastItem,
    setLastItem,
  };
};
