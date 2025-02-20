/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect, useRef, useState } from 'react';

export const usePlacement = () => {
  const elementRef = useRef(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const calculateDistance = () => {
      if (elementRef.current) {
        const elementRect = elementRef.current.getBoundingClientRect();
        const bodyRect = document.body.getBoundingClientRect();
        const distanceToRight = bodyRect.right - elementRect.right;
        setDistance(distanceToRight);
      }
    };
    calculateDistance();
  }, [elementRef.current]);

  return [elementRef, distance > 200 ? 'bottomLeft' : 'bottomRight'] as any;
};
