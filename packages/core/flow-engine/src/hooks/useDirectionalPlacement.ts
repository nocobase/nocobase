/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ConfigProvider } from 'antd';
import { useContext } from 'react';
import { flipPlacement } from '../utils/placement';

/**
 * Returns the placement mirrored for the current antd direction, so `bottomLeft` stays at the start of the trigger
 * in both left-to-right and right-to-left layouts.
 */
export function useDirectionalPlacement<T extends string | undefined>(placement: T): T {
  const { direction } = useContext(ConfigProvider.ConfigContext);
  return flipPlacement(placement, direction);
}
