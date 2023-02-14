import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { RemoveActionContext } from './context';
import { DynamicComponent } from '../../schema-component/antd/filter/DynamicComponent';
import { useValues } from './useValues';
import { ActionType } from './type';

export const LinkageRuleAction = observer((props: any) => {
  const { value } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const [editFalg, setEditFlag] = useState(false);
  const remove = useContext(RemoveActionContext);
  const { schema, fields, operator, setDataIndex, setOperator, setValue } = useValues();
  const operators = [
    { label: t('Display'), value: 'display', selected: true, schema: {} },
    { label: t('Editable'), value: 'editable', selected: false, schema: {} },
    { label: t('ReadOnly'), value: 'readOnly', selected: false, schema: {} },
    { label: t('ReadPretty'), value: 'readPretty', selected: false, schema: {} },
    { label: t('Hide'), value: 'hide', selected: false, schema: { 'x-display': 'hidden' } },
    { label: t('Hidden-reserved value'), value: 'hidden', selected: false, schema: {} },
    { label: t('Required true'), value: 'required', selected: false, schema: {} },
    { label: t('Required false'), value: 'inRequired', selected: false, schema: {} },
    { label: t('Value'), value: 'value', selected: false, schema: {} },
  ];
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Cascader
          className={css`
            min-width: 160px;
          `}
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          changeOnSelect={false}
          value={value?.targetFields}
          multiple
          options={compile(fields)}
          onChange={(value) => {
            setDataIndex(value);
          }}
          placeholder={t('Select Field')}
        />
        <Select
          value={operator}
          options={compile(operators)}
          onChange={(value) => {
            const flag = [ActionType.Value].includes(value);
            setEditFlag(flag);
            setOperator(value);
          }}
          placeholder={t('action')}
        />
        {editFalg &&
          React.createElement(DynamicComponent, {
            value,
            schema,
            onChange(value) {
              setValue(value);
            },
          })}
        {!props.disabled && (
          <a>
            <CloseCircleOutlined onClick={() => remove()} style={{ color: '#bfbfbf' }} />
          </a>
        )}
      </Space>
    </div>
  );
});
