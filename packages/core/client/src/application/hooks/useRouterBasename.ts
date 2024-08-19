/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useHref } from 'react-router-dom';

/**
 * see: https://stackoverflow.com/questions/50449423/accessing-basename-of-browserouter
 * @returns {string} basename
 */
export const useRouterBasename = () => {
  const basenameOfCurrentRouter = useHref('/');
  return basenameOfCurrentRouter;
};
