/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Variable } from '@nocobase/client';
import React from 'react';
import { useVariableOptions } from '../hooks';

export function FilterDynamicComponent(props) {
  const { value, onChange, renderSchemaComponent } = props;
  const options = useVariableOptions();

  return (
    <Variable.Input value={value} onChange={onChange} scope={options}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
