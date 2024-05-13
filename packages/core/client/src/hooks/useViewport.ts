/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useRef } from 'react';

const useViewportMeta = () => {
  const contentRef = useRef<string>('initial-scale=0.1');
  const metaRef = useRef<HTMLMetaElement>();

  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (meta) {
      contentRef.current = meta.content;
    } else {
      meta = document.createElement('meta');
      meta.name = 'viewport';
    }
    if (meta) {
      meta.content = 'width=device-width, initial-scale=1, user-scalable=0';
      metaRef.current = meta;
    }
  }, []);

  const restore = () => {
    if (metaRef.current) {
      metaRef.current.content = contentRef.current;
    }
  };

  return {
    metaRef,
    restore,
  };
};

export function useViewport() {
  const { metaRef, restore } = useViewportMeta();
  useEffect(() => {
    if (!metaRef.current) {
      return;
    }
    document.head.insertBefore(metaRef.current, document.head.firstChild);
    return () => {
      restore();
    };
  }, []);
}
