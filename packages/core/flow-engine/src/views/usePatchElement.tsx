/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as React from 'react';

export default function usePatchElement<T = React.ReactElement>(): [T[], (element: T) => () => void] {
  const [elements, setElements] = React.useState<T[]>([]);

  const patchElement = React.useCallback((element: T) => {
    // append a new element to elements (and create a new ref)
    setElements((originElements) => [...originElements, element]);

    // return a function that removes the new element out of elements (and create a new ref)
    // it works a little like useEffect
    return () => {
      setElements((originElements) => originElements.filter((ele) => ele !== element));
    };
  }, []);

  return [elements, patchElement];
}
