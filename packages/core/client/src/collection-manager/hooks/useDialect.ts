/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCurrentAppInfo } from '../../appInfo';

const useDialect = () => {
  const {
    data: { database },
  } = useCurrentAppInfo() || {
    data: {
      database: {} as any,
    },
  };

  const isDialect = (dialect: string) => database?.dialect === dialect;

  return {
    isDialect,
    dialect: database?.dialect,
  };
};

export default useDialect;
