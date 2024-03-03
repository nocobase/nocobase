import { Input, Select } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../block-provider';
import { useRecord } from '../../record-provider';
import { Variable } from '.././../schema-component';
import { useCompatOldVariables } from '../VariableInput/VariableInput';
import { useVariableOptions } from '../VariableInput/hooks/useVariableOptions';
import { DynamicComponent } from './DynamicComponent';

const { Option } = Select;

interface ValueDynamicComponentProps {
  fieldValue: any;
  schema: any;
  setValue: (value: any) => void;
  collectionName: string;
}

export const ValueDynamicComponent = (props: ValueDynamicComponentProps) => {
  const { fieldValue, schema, setValue, collectionName } = props;
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
    return { minWidth: 150, maxWidth: 430, marginLeft: 5 };
  }, []);
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
    return { minWidth: 460, marginRight: 15 };
  }, []);
  const compatScope = useMemo(() => {
    return compatOldVariables(scope, {
      value: fieldValue?.value,
    });
  }, [compatOldVariables, fieldValue?.value, scope]);

  const modeMap = {
    // 常量
    constant: (
      <div role="button" aria-label="dynamic-component-linkage-rules" style={constantStyle}>
        {React.createElement(DynamicComponent, {
          value: fieldValue?.value || fieldValue,
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
            mode: value,
          });
        }}
      >
        <Option value="constant">{t('Constant value')}</Option>
        <Option value="express">{t('Expression')}</Option>
        <Option value="empty">{t('Empty')}</Option>
      </Select>
      {modeMap[mode]}
    </Input.Group>
  );
};
