/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionContext,
  useFilterFieldOptions,
  useFilterFieldProps,
  useResourceActionContext,
} from '@nocobase/client';
import { useContext } from 'react';

export const useFilterActionProps = () => {
  const collection = useContext(CollectionContext);
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};
