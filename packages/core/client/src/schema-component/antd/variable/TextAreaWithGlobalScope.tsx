/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { connect, mapReadPretty } from '@formily/react';
import { TextArea } from './TextArea';
import { RawTextArea } from './RawTextArea';
import { Password } from '../password';
import { useApp } from '../../../';
import { Variable } from './Variable';
import { Input } from '../input';

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

const isVariable = (value) => {
  const regex = /{{.*?}}/;
  return regex.test(value);
};
interface TextAreaWithGlobalScopeProps {
  supportsLineBreak?: boolean;
  password?: boolean;
  number?: boolean;
  boolean?: boolean;
  value?: any;
  scope?: string | object;
  [key: string]: any;
}

export const TextAreaWithGlobalScope = connect((props: TextAreaWithGlobalScopeProps) => {
  const { supportsLineBreak, password, number, boolean, ...others } = props;
  const scope = useEnvironmentVariableOptions(props.scope);
  const fieldNames = { value: 'name', label: 'title' };

  if (supportsLineBreak) {
    return <RawTextArea {...others} scope={scope} fieldNames={fieldNames} rows={3} />;
  }
  if (number) {
    return <Variable.Input {...props} scope={scope} fieldNames={fieldNames} />;
  }
  if (password && props.value && !isVariable(props.value)) {
    return <Password {...others} autoFocus />;
  }
  if (boolean) {
    return <Variable.Input {...props} scope={scope} fieldNames={fieldNames} />;
  }
  return <TextArea {...others} scope={scope} fieldNames={fieldNames} />;
}, mapReadPretty(Input.ReadPretty));
