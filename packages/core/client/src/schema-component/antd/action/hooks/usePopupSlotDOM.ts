/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useMemo } from 'react';

/**
 * Used to get the DOM container for rendering popups or subpages.
 * @returns
 */
export const usePopupOrSubpagesContainerDOM = () => {
  const containerDOM: HTMLElement = useMemo(
    () => document.querySelector('.nb-subpages-slot-without-header-and-side'),
    [],
  );
  const getContainerDOM = useCallback(() => containerDOM, [containerDOM]);

  return { getContainerDOM };
};
