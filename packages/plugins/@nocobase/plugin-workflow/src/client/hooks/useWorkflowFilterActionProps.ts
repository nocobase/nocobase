/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useFilterFieldOptions,
  useFilterFieldProps,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';

export const useWorkflowFilterActionProps = () => {
  const { collection } = useResourceContext();
  const options = useFilterFieldOptions(collection.fields);
  const service = useResourceActionContext();
  return useFilterFieldProps({
    // 目前仅需要支持筛选 title 和 name，其它字段可能会报错。详见：https://nocobase.height.app/T-2745
    options,
    params: service.state?.params?.[0] || service.params,
    service,
  });
};
