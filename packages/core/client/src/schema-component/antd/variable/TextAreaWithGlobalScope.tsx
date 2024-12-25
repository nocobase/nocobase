/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { TextArea } from './TextArea';
import { RawTextArea } from './RawTextArea';
import { Password } from '../password';
import { isVariable } from '../../../variables/utils/isVariable';
import { useApp } from '../../../';
import { InputNumber } from '../input-number';
import { Variable } from './Variable';

export const useEnvironmentVariableOptions = (scope) => {
  const app = useApp();
  const environmentVariables = app.getGlobalVar('$env');
  const environmentCtx = environmentVariables?.();
  return useMemo(() => {
    if (environmentCtx) {
      return [environmentCtx].filter(Boolean);
    }
    return scope;
  }, [environmentCtx, scope]);
};

export const TextAreaWithGlobalScope = (props) => {
  const { supportsLineBreak, password, number, boolean, ...others } = props;
  const scope = useEnvironmentVariableOptions(props.scope);
  if (supportsLineBreak) {
    return <RawTextArea {...others} scope={scope} fieldNames={{ value: 'name', label: 'title' }} rows={3} />;
  }
  if (number) {
    return <Variable.Input {...props} scope={scope} fieldNames={{ value: 'name', label: 'title' }} />;
  }
  if (password && props.value && !isVariable(props.value)) {
    return <Password {...others} autoFocus />;
  }
  if (boolean) {
    return <Variable.Input {...props} scope={scope} fieldNames={{ value: 'name', label: 'title' }} />;
  }
  return <TextArea {...others} scope={scope} fieldNames={{ value: 'name', label: 'title' }} />;
};
