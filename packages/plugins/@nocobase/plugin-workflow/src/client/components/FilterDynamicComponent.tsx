/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { Variable } from '@nocobase/client';

import { useWorkflowVariableOptions } from '../variable';

export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  const scope = useWorkflowVariableOptions();

  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
