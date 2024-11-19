/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Input, Select } from 'antd';
import { css } from '@emotion/css';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../block-provider/FormBlockProvider';
import { useRecord } from '../../record-provider';
import { Variable } from '.././../schema-component';
import { useCompatOldVariables } from '../VariableInput/VariableInput';
import { useVariableOptions } from '../VariableInput/hooks/useVariableOptions';
import { DynamicComponent } from './DynamicComponent';

const { Option } = Select;

export type InputModeType = 'constant' | 'express' | 'empty';
interface ValueDynamicComponentProps {
  fieldValue: any;
  schema: any;
  setValue: (value: any) => void;
  collectionName: string;
  inputModes?: Array<InputModeType>;
}

export const ValueDynamicComponent = (props: ValueDynamicComponentProps) => {
  const { fieldValue, schema, setValue, collectionName, inputModes } = props;
  const [mode, setMode] = useState(fieldValue?.mode || 'constant');
  const { t } = useTranslation();
  const { form } = useFormBlockContext();
  const record = useRecord();
  const scope = useVariableOptions({
    collectionField: { uiSchema: schema },
    form,
    record,
    uiSchema: schema,
    noDisabled: true,
  });
  const { compatOldVariables } = useCompatOldVariables({
    collectionField: { uiSchema: schema, collectionName },
    uiSchema: schema,
    blockCollectionName: collectionName,
  });
  const constantStyle = useMemo(() => {
    return { minWidth: 150, maxWidth: 430 };
  }, []);

  useEffect(() => {
    setMode(fieldValue?.mode || 'constant');
  }, [fieldValue?.mode]);

  const handleChangeOfConstant = useCallback(
    (value) => {
      setValue({
        mode,
        value,
      });
    },
    [mode, setValue],
  );
  const expressStyle = useMemo(() => {
    return { minWidth: 150, maxWidth: 430, fontSize: 13 };
  }, []);
  const handleChangeOfExpress = useCallback(
    (value) => {
      const result = value.replaceAll(`${collectionName}.`, '').replaceAll('$system.', '').trim();
      setValue({
        mode,
        value,
        result,
      });
    },
    [collectionName, mode, setValue],
  );
  const textAreaStyle = useMemo(() => {
    return { minWidth: 460, borderRadius: 0 };
  }, []);
  const compatScope = useMemo(() => {
    return compatOldVariables(scope, {
      value: fieldValue?.value,
    });
  }, [compatOldVariables, fieldValue?.value, scope]);
  const modeMap = {
    // 常量
    constant: (
      <div
        role="button"
        aria-label="dynamic-component-linkage-rules"
        style={constantStyle}
        className={css`
          .ant-input-affix-wrapper {
            border-radius: 0px;
          }
        `}
      >
        {React.createElement(DynamicComponent, {
          value: fieldValue?.value,
          schema,
          onChange: handleChangeOfConstant,
        })}
      </div>
    ),

    // 表达式
    express: (
      <div role="button" aria-label="dynamic-component-linkage-rules" style={expressStyle}>
        <Variable.TextArea
          value={fieldValue?.value}
          onChange={handleChangeOfExpress}
          scope={compatScope}
          style={textAreaStyle}
        />
        <>
          <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
            {t('Syntax references')}:
          </span>
          <a href="https://formulajs.info/functions/" target="_blank" rel="noreferrer">
            Formula.js
          </a>
        </>
      </div>
    ),
  };

  const isModeContained = (mode: InputModeType) => {
    if (!inputModes) return true;
    else {
      return inputModes.indexOf(mode) > -1;
    }
  };

  type Options = Array<{ value: InputModeType; label: string }>;

  const options: Options = (
    [
      { value: 'constant', label: t('Constant value') },
      { value: 'express', label: t('Expression') },
      { value: 'empty', label: t('Empty') },
    ] as const
  ).filter((option) => isModeContained(option.value));
  return (
    <Input.Group compact>
      <Select
        // @ts-ignore
        role="button"
        data-testid="select-linkage-value-type"
        value={mode}
        style={{ width: 150 }}
        onChange={(value) => {
          setMode(value);
          setValue({
            mode: value || fieldValue?.mode,
          });
        }}
      >
        {options.map((option) => (
          <Option value={option.value} key={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      {modeMap[mode]}
    </Input.Group>
  );
};
