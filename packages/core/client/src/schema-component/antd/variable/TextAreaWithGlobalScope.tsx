/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useContext } from 'react';
import { VariablesContext } from '@nocobase/client';
import { TextArea } from './TextArea';

export const useEnvironmentVariableOptions = () => {
  const data = useContext(VariablesContext);
  return useMemo(() => {
    return [data.ctxRef.current['$environment']].filter(Boolean);
  }, [data.ctxRef.current['$environment']]);
};

export const TextAreaWithGlobalScope = (props) => {
  const scope = useEnvironmentVariableOptions();
  return <TextArea {...props} scope={scope} fieldNames={{ value: 'name', label: 'title' }} />;
};
