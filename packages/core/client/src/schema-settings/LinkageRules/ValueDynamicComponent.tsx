import React, { useState } from 'react';
import { Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { DynamicComponent } from './DynamicComponent';
const { Option } = Select;
import { VariableTextArea } from './component/VariableTextArea';
import { useVariableOptions } from './Variables';

export const ValueDynamicComponent = (props) => {
  const { fieldValue, schema, setValue, collectionName } = props;
  const [mode, setMode] = useState(fieldValue?.mode || 'constant');
  const { t } = useTranslation();
  const scope = useVariableOptions(collectionName);
  return (
    <Input.Group compact style={{ minWidth: 280 }}>
      <Select value={mode} style={{ width: '32%', maxWidth: '100px' }} onChange={(value) => setMode(value)}>
        <Option value="constant">{t('Constant value')}</Option>
        <Option value="express">{t('Expression')}</Option>
      </Select>
      <div style={{ width: '68%' }}>
        {mode === 'constant' ? (
          React.createElement(DynamicComponent, {
            value: fieldValue?.value || fieldValue,
            schema,
            onChange(value) {
              setValue({
                mode,
                value,
              });
            },
          })
        ) : (
          <VariableTextArea
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
        )}
      </div>
    </Input.Group>
  );
};
