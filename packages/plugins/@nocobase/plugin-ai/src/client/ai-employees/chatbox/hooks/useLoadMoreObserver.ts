/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useRef } from 'react';

export const useLoadMoreObserver = ({ loadMore }: { loadMore: () => void }) => {
  const lastElementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setLastElementRef = useCallback(
    (node: HTMLElement | null) => {
      lastElementRef.current = node;

      if (node) {
        observerRef.current?.disconnect();

        observerRef.current = new IntersectionObserver((entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            observerRef.current?.unobserve(entry.target);
            loadMore();
            setTimeout(() => {
              if (lastElementRef.current) {
                observerRef.current?.observe(lastElementRef.current);
              }
            }, 100);
          }
        });

        observerRef.current.observe(node);
      }
    },
    [loadMore],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref: setLastElementRef };
};
