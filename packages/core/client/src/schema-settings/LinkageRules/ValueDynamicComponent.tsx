import { Input, Select } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../block-provider';
import { useRecord } from '../../record-provider';
import { Variable } from '.././../schema-component';
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
    blockCollectionName: collectionName,
    form,
    record,
    uiSchema: schema,
  });

  return (
    <Input.Group compact>
      <Select
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
      {mode === 'constant' ? (
        <div style={{ minWidth: 150, maxWidth: 430, marginLeft: 5 }}>
          {React.createElement(DynamicComponent, {
            value: fieldValue?.value || fieldValue,
            schema,
            onChange(value) {
              setValue({
                mode,
                value,
              });
            },
          })}
        </div>
      ) : mode === 'express' ? (
        <div style={{ minWidth: 150, maxWidth: 430, fontSize: 13 }}>
          <Variable.TextArea
            value={fieldValue?.value}
            onChange={(value) => {
              const result = value.replaceAll(`${collectionName}.`, '').replaceAll('$system.', '').trim();
              setValue({
                mode,
                value,
                result,
              });
            }}
            scope={scope}
            style={{ minWidth: 460, marginRight: 15 }}
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
      ) : null}
    </Input.Group>
  );
};
